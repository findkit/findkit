import { tabbable, isTabbable, FocusableElement } from "tabbable";
import { listen, Resources } from "./resources";

function getTabbables(el: HTMLElement) {
	const tabbables = tabbable(el);

	// Return the container as the only tappable if it does not itself contain
	// any tabbables
	if (tabbables.length === 0 && isTabbable(el)) {
		return [el];
	}

	return tabbables;
}

interface FocusTrapOptions {
	containers: HTMLElement | HTMLElement[] | NodeList | null | undefined;

	/**
	 * Disable the trap when user click an element outside of the selected
	 * containers
	 */
	outsideClickDisables?: boolean;

	/**
	 * Disable the trap when user hits escape key
	 */
	escDisables?: boolean;

	/**
	 * Options to control aspects of the focusing process
	 */
	focusOptions?: FocusOptions;

	/**
	 * Executed before trap enables
	 */
	onBeforeEnable?(trap: FocusTrap): void;

	/**
	 * Executed after the trap has been enabled
	 */
	onBeforeDisable?(trap: FocusTrap): void;

	/**
	 * Execute before the trap gets disabled
	 */
	onAfterEnable?(trap: FocusTrap): void;

	/**
	 * Executed after the trap has been disabled. By default the focus trap
	 * restores focus to the element that had the focus before trap activation.
	 * This hook can used to focus some other element manually.
	 */
	onAfterDisable?(trap: FocusTrap): void;

	/**
	 * Skip focusing given tabbable when returning false
	 */
	validateTabbable?(
		tabbable: Element,
		container: Element,
		trap: FocusTrap,
	): boolean;
}

/**
 * Returns true for events that target elements that are NOT shadow dom hosts
 */
function isValidEvent(event: any): event is {
	target: Element;
	keyCode?: number;
	shiftKey?: boolean;
	stopImmediatePropagation(): void;
} {
	const el = event?.target;
	return el instanceof Element && !el.shadowRoot;
}

export class FocusTrap {
	/**
	 * The currently active FocusTrap instance
	 */
	static current?: FocusTrap;

	/**
	 * Reference to the previously enabled focus trap when nesting traps
	 */
	parent?: FocusTrap;

	/**
	 * Element this focus trap had focus on most recently
	 */
	private PRIVATE_lastFocusedElement?: HTMLElement;

	/**
	 * Element that had focus before the trap was enabled
	 */
	elementBeforeTrap?: HTMLElement;

	private PRIVATE_containers: HTMLElement[];

	private PRIVATE_state = {
		active: false,
		currentContainerIndex: null as number | null,
		shifKeyDown: false,
		usingMouse: false,
	};

	private PRIVATE_options: FocusTrapOptions;

	private PRIVATE_shadowRoots: Set<ShadowRoot>;

	private PRIVATE_eventListeners?: Resources;

	constructor(options: FocusTrapOptions) {
		this.PRIVATE_options = options;
		let elements;

		if (options.containers instanceof NodeList) {
			elements = Array.from(options.containers) as HTMLElement[];
		} else if (options.containers instanceof HTMLElement) {
			elements = [options.containers];
		} else if (!options.containers) {
			elements = [] as HTMLElement[];
		} else {
			elements = options.containers;
		}

		if (elements.length === 0) {
			console.warn("No elements passed to FocusTrap");
		}

		this.PRIVATE_containers = elements;

		this.PRIVATE_shadowRoots = new Set();
		for (const el of elements) {
			if (el.shadowRoot) {
				this.PRIVATE_shadowRoots.add(el.shadowRoot);
			}

			const root = el.getRootNode();
			if (root instanceof ShadowRoot) {
				this.PRIVATE_shadowRoots.add(root);
			}
		}
	}

	isEnabled() {
		return this.PRIVATE_state.active;
	}

	private PRIVATE_bind(doc: Document | ShadowRoot) {
		if (!this.PRIVATE_eventListeners) {
			this.PRIVATE_eventListeners = new Resources();
		}

		this.PRIVATE_eventListeners.create(() =>
			listen(doc, "keydown", this.PRIVATE_keyDown, false),
		);

		this.PRIVATE_eventListeners.create(() =>
			listen(doc, "keyup", this.PRIVATE_keyUp, false),
		);

		this.PRIVATE_eventListeners.create(() =>
			listen(doc, "focusin", this.PRIVATE_focusIn, false),
		);

		this.PRIVATE_eventListeners.create(() =>
			listen(doc, "mousedown", this.PRIVATE_mouseDown, false),
		);

		this.PRIVATE_eventListeners.create(() =>
			listen(doc, "mouseup", this.PRIVATE_mouseUp, false),
		);
	}

	/**
	 * Enable trap
	 */
	enable() {
		if (this.PRIVATE_options.onBeforeEnable) {
			this.PRIVATE_options.onBeforeEnable(this);
		}

		const activeElement = this.PRIVATE_getActiveElement();
		if (activeElement instanceof HTMLElement) {
			this.elementBeforeTrap = activeElement || undefined;
		}

		if (FocusTrap.current) {
			const parent = FocusTrap.current;
			FocusTrap.current.disable({ ignoreParent: true });
			this.parent = parent;
		}

		FocusTrap.current = this;

		this.PRIVATE_bind(document);
		for (const root of this.PRIVATE_shadowRoots) {
			this.PRIVATE_bind(root);
		}

		this.PRIVATE_state.active = true;

		if (this.PRIVATE_lastFocusedElement) {
			this.PRIVATE_setElementFocus(this.PRIVATE_lastFocusedElement);
		} else {
			const activeElement = this.PRIVATE_getActiveElement();
			if (
				activeElement instanceof HTMLElement &&
				this.PRIVATE_isValidFocus(activeElement)
			) {
				// If we have a valid focus update container index so tabbing
				// can work correctly
				this.PRIVATE_updateContainerIndex(activeElement);
			} else {
				// Move focus to the first tabbable element of the first container
				// if we don't already have a valid focus
				this.PRIVATE_fixFocus();
			}
		}

		if (this.PRIVATE_options.onAfterEnable) {
			this.PRIVATE_options.onAfterEnable(this);
		}
	}

	/**
	 * Disable trap
	 */
	disable(options?: { ignoreParent?: boolean }) {
		if (!this.isEnabled()) {
			return;
		}

		if (FocusTrap.current !== this) {
			console.warn("Not currently active focus-trap, cannot disable");
			return;
		}

		if (this.PRIVATE_options.onBeforeDisable) {
			this.PRIVATE_options.onBeforeDisable(this);
		}

		this.PRIVATE_eventListeners?.dispose();
		this.PRIVATE_eventListeners = undefined;

		this.PRIVATE_state.active = false;
		FocusTrap.current = undefined;

		const skipParent = options && options.ignoreParent;
		if (!skipParent && this.parent) {
			if (this.PRIVATE_options.onAfterDisable) {
				this.PRIVATE_options.onAfterDisable(this);
			}
			this.parent.enable();
			this.parent = undefined;
		} else if (this.elementBeforeTrap) {
			this.PRIVATE_setElementFocus(this.elementBeforeTrap);

			if (this.PRIVATE_options.onAfterDisable) {
				this.PRIVATE_options.onAfterDisable(this);
			}
		}
	}

	private PRIVATE_setElementFocus(element: FocusableElement) {
		element.focus(this.PRIVATE_options.focusOptions);
	}

	/**
	 * Fix focus back to an element inside a container when we detect focus is
	 * being moved to an illegal element.
	 */
	private PRIVATE_fixFocus(attempts = 0) {
		if (this.PRIVATE_state.usingMouse) {
			return;
		}

		// Avoid infinite recursion
		if (attempts > this.PRIVATE_containers.length) {
			console.warn("Failed to find focusable containers");
			return;
		}

		// Shift+tab moves focus backwards
		const direction = this.PRIVATE_state.shifKeyDown ? -1 : 1;

		// Focus is now in an illegal element but user wants to move the focus.
		// Let's find the next legal container the focus can actually move to
		let nextContainerIndex = 0;

		if (this.PRIVATE_state.currentContainerIndex == null) {
			// on initial activation move focus to the first one when we have no
			// active containers yet
			this.PRIVATE_state.currentContainerIndex = 0;
		} else {
			// On subsequent calls move the next (or previous) containers
			nextContainerIndex =
				(this.PRIVATE_state.currentContainerIndex + direction) %
				this.PRIVATE_containers.length;

			// Going backwards to last container
			if (nextContainerIndex === -1) {
				nextContainerIndex = this.PRIVATE_containers.length - 1;
			}
		}

		const nextContainer = this.PRIVATE_containers[nextContainerIndex];

		// If going backwards select last tabbable from the new container
		if (this.PRIVATE_state.shifKeyDown) {
			const tabbables = this.PRIVATE_getTabbables(nextContainer);
			if (tabbables.length > 0) {
				const last = tabbables[tabbables.length - 1];
				if (last) {
					this.PRIVATE_setElementFocus(last);
				}
			} else {
				// The container had no tabbable items update the current
				// container and restart focus moving attempt
				this.PRIVATE_state.currentContainerIndex = nextContainerIndex;
				this.PRIVATE_fixFocus(attempts + 1);
			}
		} else {
			const tabbables = this.PRIVATE_getTabbables(nextContainer);
			if (tabbables.length > 0 && tabbables[0]) {
				this.PRIVATE_setElementFocus(tabbables[0]);
			} else {
				// The container had no tabbable items...
				this.PRIVATE_state.currentContainerIndex = nextContainerIndex;
				this.PRIVATE_fixFocus(attempts + 1);
			}
		}
	}

	/**
	 * Update currently active trap container index
	 */
	private PRIVATE_updateContainerIndex(nextElement: Node) {
		const nextIndex = this.PRIVATE_containers.findIndex((container) =>
			container.contains(nextElement),
		);
		if (nextIndex !== -1) {
			this.PRIVATE_state.currentContainerIndex = nextIndex;
		}
	}

	private PRIVATE_isInContainer(el: Element) {
		for (const container of this.PRIVATE_containers) {
			if (el === container || container.contains(el)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if the element is valid tabblable in our containers
	 */
	private PRIVATE_isValidFocus(el: Element) {
		if (!this.PRIVATE_isInContainer(el)) {
			return false;
		}

		const containerIndex = this.PRIVATE_state.currentContainerIndex || 0;
		if (
			!this.PRIVATE_isValidTabbable(el, this.PRIVATE_containers[containerIndex])
		) {
			return false;
		}

		return true;
	}

	private PRIVATE_getTabbables(container: HTMLElement | undefined) {
		if (!container) {
			throw new Error("Cannot pass undefined to getTabbables");
		}

		return getTabbables(container).filter((tabbable) => {
			return this.PRIVATE_isValidTabbable(tabbable, container);
		});
	}

	private PRIVATE_isValidTabbable(
		maybeTabbable: Element,
		container: HTMLElement | undefined,
	) {
		if (!container) {
			return false;
		}

		if (
			this.PRIVATE_options.validateTabbable &&
			this.PRIVATE_options.validateTabbable(maybeTabbable, container, this)
		) {
			return true;
		}

		if (isTabbable(maybeTabbable)) {
			return true;
		}

		return false;
	}

	private PRIVATE_getActiveElement() {
		const el = document.activeElement;
		return el?.shadowRoot?.activeElement ?? el;
	}

	private PRIVATE_mouseDown = (e: {}) => {
		if (!isValidEvent(e)) {
			return;
		}

		this.PRIVATE_state.usingMouse = true;

		if (
			this.PRIVATE_options.outsideClickDisables &&
			!this.PRIVATE_isInContainer(e.target)
		) {
			this.disable();
		}
	};

	private PRIVATE_mouseUp = (e: {}) => {
		if (!isValidEvent(e)) {
			return;
		}

		this.PRIVATE_state.usingMouse = false;
	};

	private PRIVATE_keyDown = (e: {}) => {
		if (!isValidEvent(e)) {
			return;
		}

		if (this.PRIVATE_options.escDisables && e.keyCode === 27) {
			this.disable();
		}

		if (e.shiftKey) {
			this.PRIVATE_state.shifKeyDown = true;
		}
	};

	private PRIVATE_keyUp = (e: {}) => {
		if (!isValidEvent(e)) {
			return;
		}

		if (e.shiftKey) {
			this.PRIVATE_state.shifKeyDown = false;
		}
	};

	private PRIVATE_focusIn = (e: {}) => {
		if (!isValidEvent(e)) {
			return;
		}

		/**
		 * Last focused element
		 */

		// Update lastly focused element
		const activeElement = this.PRIVATE_getActiveElement();
		if (activeElement instanceof HTMLElement) {
			this.PRIVATE_lastFocusedElement = activeElement;
		}

		// Keep track of the container we're in
		this.PRIVATE_updateContainerIndex(e.target);

		// Focus still inside our containers. Focus can move freely here. Nothing to do.
		if (this.PRIVATE_isValidFocus(e.target)) {
			return;
		}

		// !!! Focus is moving to an element outside of the containers!

		// Prevent other focusIn handlers from executing
		e.stopImmediatePropagation();

		// Fix focus back to a legal element inside the containers
		this.PRIVATE_fixFocus();
	};
}
