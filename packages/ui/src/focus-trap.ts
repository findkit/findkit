import { tabbable, isTabbable, FocusableElement } from "tabbable";

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
	lastFocusedElement?: HTMLElement;

	/**
	 * Element that had focus before the trap was enabled
	 */
	elementBeforeTrap?: HTMLElement;

	containers: HTMLElement[];

	private PRIVATE_state = {
		active: false,
		currentContainerIndex: null as number | null,
		shifKeyDown: false,
		usingMouse: false,
	};

	private PRIVATE_options: FocusTrapOptions;

	private PRIVATE_shadowRoots: Set<ShadowRoot>;

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

		this.containers = elements;

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

	bind(doc: Document | ShadowRoot) {
		doc.addEventListener("keydown", this.handlers.keyDown, false);
		doc.addEventListener("keyup", this.handlers.keyUp, false);
		doc.addEventListener("focusin", this.handlers.focusIn, false);
		doc.addEventListener("mousedown", this.handlers.mouseDown, false);
		doc.addEventListener("mouseup", this.handlers.mouseUp, false);
	}

	unbind(doc: Document | ShadowRoot) {
		doc.removeEventListener("keydown", this.handlers.keyDown, false);
		doc.removeEventListener("keyup", this.handlers.keyUp, false);
		doc.removeEventListener("focusin", this.handlers.focusIn, false);
		doc.removeEventListener("mousedown", this.handlers.mouseDown, false);
		doc.removeEventListener("mouseup", this.handlers.mouseUp, false);
	}

	/**
	 * Enable trap
	 */
	enable() {
		if (this.PRIVATE_options.onBeforeEnable) {
			this.PRIVATE_options.onBeforeEnable(this);
		}

		const activeElement = this.getActiveElement();
		if (activeElement instanceof HTMLElement) {
			this.elementBeforeTrap = activeElement || undefined;
		}

		if (FocusTrap.current) {
			const parent = FocusTrap.current;
			FocusTrap.current.disable({ ignoreParent: true });
			this.parent = parent;
		}

		FocusTrap.current = this;

		this.bind(document);
		for (const root of this.PRIVATE_shadowRoots) {
			this.bind(root);
		}

		this.PRIVATE_state.active = true;

		if (this.lastFocusedElement) {
			this.setElementFocus(this.lastFocusedElement);
		} else {
			const activeElement = this.getActiveElement();
			if (
				activeElement instanceof HTMLElement &&
				this.isValidFocus(activeElement)
			) {
				// If we have a valid focus update container index so tabbing
				// can work correctly
				this.updateContainerIndex(activeElement);
			} else {
				// Move focus to the first tabbable element of the first container
				// if we don't already have a valid focus
				this.fixFocus();
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

		this.unbind(document);
		for (const root of this.PRIVATE_shadowRoots) {
			this.unbind(root);
		}

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
			this.setElementFocus(this.elementBeforeTrap);

			if (this.PRIVATE_options.onAfterDisable) {
				this.PRIVATE_options.onAfterDisable(this);
			}
		}
	}

	setElementFocus(element: FocusableElement) {
		element.focus(this.PRIVATE_options.focusOptions);
	}

	/**
	 * Fix focus back to an element inside a container when we detect focus is
	 * being moved to an illegal element.
	 */
	fixFocus(attempts = 0) {
		// Avoid infinite recursion
		if (attempts > this.containers.length) {
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
				this.containers.length;

			// Going backwards to last container
			if (nextContainerIndex === -1) {
				nextContainerIndex = this.containers.length - 1;
			}
		}

		const nextContainer = this.containers[nextContainerIndex];

		// If going backwards select last tabbable from the new container
		if (this.PRIVATE_state.shifKeyDown) {
			const tabbables = this.getTabbables(nextContainer);
			if (tabbables.length > 0) {
				const last = tabbables[tabbables.length - 1];
				if (last) {
					this.setElementFocus(last);
				}
			} else {
				// The container had no tabbable items update the current
				// container and restart focus moving attempt
				this.PRIVATE_state.currentContainerIndex = nextContainerIndex;
				this.fixFocus(attempts + 1);
			}
		} else {
			const tabbables = this.getTabbables(nextContainer);
			if (tabbables.length > 0 && tabbables[0]) {
				this.setElementFocus(tabbables[0]);
			} else {
				// The container had no tabbable items...
				this.PRIVATE_state.currentContainerIndex = nextContainerIndex;
				this.fixFocus(attempts + 1);
			}
		}
	}

	/**
	 * Update currently active trap container index
	 */
	updateContainerIndex(nextElement: Node) {
		const nextIndex = this.containers.findIndex((container) =>
			container.contains(nextElement),
		);
		if (nextIndex !== -1) {
			this.PRIVATE_state.currentContainerIndex = nextIndex;
		}
	}

	/**
	 * Returns true if the element is valid tabblable in our containers
	 */
	isValidFocus(el: Element) {
		let inContainer = false;

		for (const container of this.containers) {
			if (el === container || container.contains(el)) {
				inContainer = true;
				break;
			}
		}

		if (!inContainer) {
			return false;
		}

		const containerIndex = this.PRIVATE_state.currentContainerIndex || 0;
		if (!this.isValidTabbable(el, this.containers[containerIndex])) {
			return false;
		}

		return true;
	}

	getTabbables(container: HTMLElement | undefined) {
		if (!container) {
			throw new Error("Cannot pass undefined to getTabbables");
		}

		return getTabbables(container).filter((tabbable) => {
			return this.isValidTabbable(tabbable, container);
		});
	}

	isValidTabbable(tabbable: Element, container: HTMLElement | undefined) {
		if (!this.PRIVATE_options.validateTabbable) {
			return isTabbable(tabbable);
		}

		if (!container) {
			return false;
		}

		return this.PRIVATE_options.validateTabbable(tabbable, container, this);
	}

	getActiveElement() {
		const el = document.activeElement;
		return el?.shadowRoot?.activeElement ?? el;
	}

	handlers = {
		mouseDown: (e: {}) => {
			if (!isValidEvent(e)) {
				return;
			}

			if (!this.isValidFocus(e.target)) {
				this.PRIVATE_state.usingMouse = true;

				if (this.PRIVATE_options.outsideClickDisables) {
					this.disable();
				}
			}
		},
		mouseUp: (e: {}) => {
			if (!isValidEvent(e)) {
				return;
			}

			this.PRIVATE_state.usingMouse = false;
		},

		keyDown: (e: {}) => {
			if (!isValidEvent(e)) {
				return;
			}

			if (this.PRIVATE_options.escDisables && e.keyCode === 27) {
				this.disable();
			}

			if (e.shiftKey) {
				this.PRIVATE_state.shifKeyDown = true;
			}
		},

		keyUp: (e: {}) => {
			if (!isValidEvent(e)) {
				return;
			}

			if (e.shiftKey) {
				this.PRIVATE_state.shifKeyDown = false;
			}
		},

		focusIn: (e: {}) => {
			if (!isValidEvent(e)) {
				return;
			}

			/**
			 * Last focused element
			 */
			const prev = this.lastFocusedElement;

			// Update lastly focused element
			const activeElement = this.getActiveElement();
			if (activeElement instanceof HTMLElement) {
				this.lastFocusedElement = activeElement;
			}

			// Keep track of the container we're in
			this.updateContainerIndex(e.target);

			// Focus still inside our containers. Focus can move freely here. Nothing to do.
			if (this.isValidFocus(e.target)) {
				return;
			}

			// If focus was moved to a illegal element by mouse just revert the
			// focus back to the previous element
			if (this.PRIVATE_state.usingMouse && prev) {
				this.lastFocusedElement = prev;
				this.setElementFocus(prev);
				return;
			}

			// !!! Focus is moving to an element outside of the containers!

			// Prevent other focusIn handlers from executing
			e.stopImmediatePropagation();

			// Fix focus back to a legal element inside the containers
			this.fixFocus();
		},
	};
}
