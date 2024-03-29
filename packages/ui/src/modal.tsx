import { FocusTrap } from "./focus-trap";
import React, {
	StrictMode,
	useRef,
	useEffect,
	useState,
	useLayoutEffect,
	ReactNode,
} from "react";
import ReactDOM from "react-dom";
import {
	Results,
	FindkitProvider,
	Logo,
	Spinner,
	ErrorContainer,
} from "./components";
import {
	useSearchEngineState,
	useSearchEngine,
	useInput,
	useTranslator,
	useContainerKeyboardAttributes,
	useView,
} from "./core-hooks";

import {
	SearchEngine,
	GroupDefinition,
	SearchParams,
	SearchEngineOptions,
	GroupOrder,
} from "./search-engine";
import { cn, deprecationNotice, getScrollContainer, View } from "./utils";
import type { Emitter, FindkitUIEvents } from "./emitter";
import { TranslationStrings } from "./translations";
import { Slots } from "./slots";
import { SlotCatchBoundary, createSlotComponent } from "./slots-core";

function useScrollLock(lock: boolean) {
	useLayoutEffect(() => {
		if (!lock) {
			return;
		}

		// The <html> element
		const html = window.document.documentElement;

		const origHeight = html.style.height;
		const origOverflow = html.style.overflow;

		html.style.height = "100%;";
		html.style.overflow = "hidden";

		return () => {
			html.style.height = origHeight;
			html.style.overflow = origOverflow;
		};
	}, [lock]);
}

function useOpenCloseEvents(mounted: boolean) {
	const engine = useSearchEngine();

	useLayoutEffect(() => {
		if (!mounted) {
			return;
		}

		const container =
			engine.container instanceof ShadowRoot
				? engine.container.host
				: engine.container;

		engine.events.emit("open", {
			container,
		});

		return () => {
			engine.events.emit("close", {
				container,
			});
		};
	}, [engine, mounted]);
}

function useFocusTrap(
	containerRef: React.MutableRefObject<HTMLDivElement | null>,
) {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const isOpen = state.status !== "closed";
	const trapRef = useRef<FocusTrap | null>(null);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const inputs = state.inputs.map((input) => input.el);
		const trapElements = state.trapElements.map((ref) => ref.el);

		if (!trapRef.current && containerRef.current) {
			trapRef.current = new FocusTrap({
				containers: [containerRef.current, ...inputs, ...trapElements],
				escDisables: true,
				outsideClickDisables: engine.closeOnOutsideClick,
				onAfterEnable() {
					for (const input of inputs) {
						if (containerRef.current?.contains(input)) {
							input.focus();
						}
					}
				},
				onAfterDisable() {
					if (trapRef.current) {
						engine.close();
					}
				},
			});
			trapRef.current.enable();
		}

		return () => {
			const trap = trapRef.current;
			trapRef.current = null;
			trap?.disable();
		};
	}, [containerRef, engine, isOpen, state.inputs, state.trapElements]);

	return containerRef;
}

function useIsScrollingDown(
	containerRef: React.MutableRefObject<HTMLDivElement | null>,
	isActive: boolean,
) {
	const [scrollingDown, setScrollingDown] = useState(false);
	const prev = useRef(0);

	useEffect(() => {
		if (!isActive) {
			prev.current = 0;
			setScrollingDown(false);
			return;
		}
		const el = containerRef.current;
		if (!el) {
			return;
		}

		const handleScroll = (e: Event) => {
			if (!(e.target instanceof HTMLDivElement)) {
				return;
			}

			const next = Math.max(0, e.target.scrollTop);
			const diff = prev.current - next;
			const threshold = 30;

			if (diff < -threshold) {
				setScrollingDown(true);
				prev.current = next;
			}

			if (diff > threshold) {
				setScrollingDown(false);
				prev.current = next;
			}
		};

		el.addEventListener("scroll", handleScroll, {
			passive: true,
		});

		return () => {
			el.removeEventListener("scroll", handleScroll);
		};
	}, [containerRef, isActive]);

	return scrollingDown;
}

function useDelay(
	start: boolean,
	containerRef: React.MutableRefObject<HTMLDivElement | null>,
) {
	const [end, setEnd] = useState(false);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) {
			return;
		}

		const delay = getComputedStyle(el).getPropertyValue(
			"--findkit--modal-animation-duration",
		);

		const ms = Number(/(\d+)ms/.exec(delay)?.[1] ?? 0);

		if (start) {
			setEnd(start);
		} else {
			const timer = setTimeout(() => {
				setEnd(false);
			}, ms);

			return () => {
				clearTimeout(timer);
			};
		}
	}, [containerRef, start]);

	return end;
}

function Cross() {
	return (
		<svg
			stroke="currentColor"
			fill="currentColor"
			className={cn("cross")}
			strokeWidth={0}
			viewBox="0 0 24 24"
			height={28}
			width={28}
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M13.4119 12.0002L17.7119 7.71019C18.104 7.31806 18.104 6.68231 17.7119 6.29019C17.3198 5.89806 16.684 5.89806 16.2919 6.29019L12.0019 10.5902L7.71189 6.29019L7.71189 6.29019C7.31977 5.89806 6.68401 5.89806 6.29189 6.29019C5.89977 6.68231 5.89977 7.31807 6.29189 7.71019L10.5919 12.0002L6.29189 16.2902C5.89977 16.6791 5.89717 17.3123 6.28609 17.7044C6.28802 17.7063 6.28995 17.7083 6.29189 17.7102H6.29189C6.68081 18.1023 7.31397 18.1049 7.70609 17.716C7.70803 17.7141 7.70997 17.7121 7.71189 17.7102L12.0019 13.4102L16.2919 17.7102V17.7102C16.6808 18.1023 17.314 18.1049 17.7061 17.716C17.708 17.7141 17.71 17.7121 17.7119 17.7102C18.104 17.3213 18.1066 16.6881 17.7177 16.296C17.7158 16.294 17.7138 16.2921 17.7119 16.2902L13.4119 12.0002Z"
			/>
		</svg>
	);
}

function FetchError() {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const t = useTranslator();

	if (!state.error) {
		return null;
	}

	return (
		<ErrorContainer title={t("error-title")} error={state.error?.message ?? ""}>
			<div>
				Fetch errored
				<View
					as="button"
					cn="retry-button"
					type="button"
					onClick={() => engine.retry()}
				>
					{t("try-again")}
				</View>
			</div>
		</ErrorContainer>
	);
}

function SearchInput(props: { placeholder?: string; icon?: ReactNode }) {
	const inputRef = useInput();
	const t = useTranslator();
	const state = useSearchEngineState();

	return (
		<View cn="search-input-wrap">
			{/* XXX add instance-id */}
			<View cn="sr-only" id="search-instructions">
				{t("sr-search-instructions")}
			</View>
			<View
				as="input"
				aria-describedby="search-instructions"
				placeholder={props.placeholder}
				cn="search-input"
				type="text"
				ref={inputRef}
				aria-label={t("aria-label-search-input")}
			/>
			<Spinner />
			<View
				cn={{
					["search-input-icon-container"]: true,
					["search-input-icon-container-hide"]: state.loading,
				}}
			>
				{props.icon ?? <Logo />}
			</View>
		</View>
	);
}

function CloseButton(props: { children?: ReactNode }) {
	const engine = useSearchEngine();
	const t = useTranslator();

	return (
		<View
			cn="close-button"
			as="button"
			type="button"
			aria-label={t("aria-label-close-search")}
			onClick={() => {
				engine.close();
			}}
		>
			{props.children ?? (
				<>
					{t("close")} <Cross />
				</>
			)}
		</View>
	);
}

const HeaderSlot = createSlotComponent("Header", {
	parts: {
		Input: SearchInput,
		CloseButton,
	},
	render() {
		return (
			<>
				<CloseButton />
				<SearchInput />
			</>
		);
	},
});

function Modal() {
	const view = useView();
	const engine = useSearchEngine();
	const state = useSearchEngineState();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const containerKbAttrs = useContainerKeyboardAttributes();
	useFocusTrap(containerRef);

	const show = state.status !== "closed";
	const delayed = useDelay(show, containerRef);
	const unmount = !delayed && !show;
	const isScrollingDown = useIsScrollingDown(containerRef, show);

	useOpenCloseEvents(!unmount);
	useScrollLock(!unmount && state.lockScroll);

	useScrollRestore(containerRef);

	// Use delayed to keep the open body class until the animation is done
	useEffect(() => {
		const classList = document.body.classList;

		// Just to be cleaner use the instance id only when not using the default one
		const prefix =
			engine.instanceId === "fdk" ? "findkit-ui" : `${engine.instanceId}`;

		const open = `${prefix}-open`;

		if (delayed) {
			classList.add(open);
		} else {
			classList.remove(open);
		}
	}, [delayed, engine.instanceId, show]);

	if (unmount) {
		return null;
	}

	const visible = show && delayed;

	const header = state.header ? (
		<View
			cn={{
				header: true,
				"header-hidden": isScrollingDown,
			}}
		>
			<HeaderSlot Input={SearchInput} CloseButton={CloseButton} />
		</View>
	) : null;

	const content = (
		<View cn="content">
			<FetchError />
			<SlotCatchBoundary name="Content" props={{}}>
				<Results />
			</SlotCatchBoundary>
		</View>
	);

	return (
		<View
			data-id={engine.instanceId}
			cn={{
				backdrop: true,
				container: true,
				"modal-container": true,
				"backdrop-visible": visible,
			}}
			onClick={(e) => {
				if (
					e.target instanceof HTMLElement &&
					e.target.classList.contains(cn("backdrop"))
				) {
					engine.close();
				}
			}}
		>
			<ScreenReaderModalMessages />
			<View
				ref={containerRef}
				{...containerKbAttrs}
				cn={{
					modal: true,
					"modal-visible": visible,

					["view-groups"]: view === "groups",
					["view-single"]: view === "single",
				}}
			>
				<SlotCatchBoundary
					name="Layout"
					props={{
						header,
						content,
					}}
				>
					{header}
					{content}
				</SlotCatchBoundary>
			</View>
		</View>
	);
}

function useScrollRestore(containerRef: React.RefObject<Element | null>) {
	const engine = useSearchEngine();
	useLayoutEffect(() => {
		let el = containerRef.current;

		if (el && engine.scrollPositionRestore !== undefined) {
			if (!el.classList.contains(cn("modal"))) {
				// On non-modal to scroll can be at any scrolling div or
				// the page itself
				el = getScrollContainer(el);
			}

			el.scrollTop = engine.scrollPositionRestore;

			// Clear the restoring value only when we manage to scroll to it.
			// The content might be still loading so we need to wait for it to
			// load fully
			if (el.scrollTop === engine.scrollPositionRestore) {
				engine.scrollPositionRestore = undefined;
			}
		}
	});
	// Yup, no effect deps here. We just need to wait when the container div
	// appears and then scroll it
}

export function Plain() {
	const engine = useSearchEngine();
	const state = useSearchEngineState();
	const containerKbAttrs = useContainerKeyboardAttributes();
	const view = useView();
	const containerRef = useRef<HTMLDivElement | null>(null);

	useScrollRestore(containerRef);
	useOpenCloseEvents(true);

	const header = state.header ? (
		<SlotCatchBoundary
			name="Header"
			props={{ Input: SearchInput, CloseButton: CloseButton }}
		>
			<SearchInput />
		</SlotCatchBoundary>
	) : null;

	const content = (
		<View cn="content">
			<FetchError />
			<SlotCatchBoundary name="Content" props={{}}>
				<Results />
			</SlotCatchBoundary>
		</View>
	);

	return (
		<View
			{...containerKbAttrs}
			ref={containerRef}
			cn={{
				container: true,
				plain: true,
				["view-groups"]: view === "groups",
				["view-single"]: view === "single",
			}}
			data-id={engine.instanceId}
		>
			<SlotCatchBoundary name="Layout" props={{ header, content }}>
				{header}
				{content}
			</SlotCatchBoundary>
		</View>
	);
}

function ScreenReaderModalMessages() {
	const state = useSearchEngineState();
	const t = useTranslator();

	const terms = state.usedTerms ?? "";
	const count = Object.values(state.resultGroups).reduce((acc, group) => {
		return acc + group.total;
	}, 0);

	const [message, setMessage] = useState("");

	useEffect(() => {
		const timer = setTimeout(() => {
			if (terms.trim()) {
				setMessage(t("sr-result-count", { count, terms }));
			} else {
				setMessage("");
			}
		}, 2000);

		return () => {
			clearTimeout(timer);
		};
	}, [count, t, terms]);

	return (
		<>
			<View cn="sr-only" aria-live="polite">
				{message}
			</View>
		</>
	);
}

function getHtmlFontSize() {
	return (
		Number(
			window
				.getComputedStyle(document.documentElement)
				.getPropertyValue("font-size")
				.replace("px", ""),
		) || 16
	);
}

function Style(props: { css?: string; layer?: string; href?: string }) {
	let css = "";

	if (props.href) {
		// css import
		css = `@import url("${props.href}")`;
		if (props.layer) {
			css += ` layer(${props.layer})`;
		}
		css += ";";
	} else if (props.css) {
		css = props.css;
		if (props.layer) {
			css = `@layer ${props.layer} {\n${css}\n}`;
		}
	}

	if (!css) {
		return null;
	}

	return (
		<style
			dangerouslySetInnerHTML={{
				__html: css,
			}}
		/>
	);
}

export type LayeredCSS = {
	css?: string;
	href?: string;
	layer?: "findkit.core" | "findkit.user";
};

function supportsCSSLayers() {
	const style = document.createElement("style");
	style.id = "findkit-test";
	style.textContent = `
        @layer findkit-test {
			#findkit-test {
				--findkit--test: 1
			}
        }
	`;

	document.head.appendChild(style);

	const res = getComputedStyle(style).getPropertyValue("--findkit--test");
	style.remove();
	return Boolean(res);
}

let SUPPORTS_CSS_LAYERS = false;
if (typeof document !== "undefined") {
	SUPPORTS_CSS_LAYERS = supportsCSSLayers();
}

/**
 * @public
 */
export function init(_options: {
	publicToken: string;
	instanceId: string;
	shadowDom?: boolean;
	cssLayers?: boolean;
	minTerms?: number;
	layeredCSS: LayeredCSS[];
	slots?: Partial<Slots>;
	events: Emitter<FindkitUIEvents, unknown>;
	searchEndpoint?: string;
	params?: SearchParams;
	forceHistoryReplace?: boolean;
	groups?: GroupDefinition[];
	pageScroll?: boolean;
	modal?: boolean;
	fetchCount?: number;
	container?: Element;
	lockScroll?: boolean;
	infiniteScroll?: boolean;
	backdrop?: boolean;
	header?: boolean;
	router?: SearchEngineOptions["router"];
	groupOrder?: GroupOrder;
	fontDivisor?: number;
	manageScroll?: boolean;
	ui?: {
		lang?: string;
		overrides?: Partial<TranslationStrings>;
	};
}) {
	const options = { ..._options };
	const hasCustomContainer = Boolean(options.container);

	if (hasCustomContainer && typeof options.modal !== "boolean") {
		options.modal = false;
	}

	if (hasCustomContainer && typeof options.forceHistoryReplace !== "boolean") {
		options.forceHistoryReplace = true;
	}

	if (options.ui) {
		deprecationNotice(
			"Using deprecated `ui` constructor option. Use `translations` and `lang`instead.",
		);
	}

	const hasGroups = options.groups && options.groups.length > 0;
	if (hasGroups && options.params) {
		console.error(
			"[ERROR] Both `groups` and `params` options passed to Findkit. Use only one or the other.",
		);
	}

	let dynamicCSS = "";

	if (options.modal === false) {
		options.pageScroll = true;
		options.lockScroll = false;
	}

	if (options.pageScroll) {
		options.lockScroll = false;
		dynamicCSS = `
			.${cn("modal-container")} {
				inset: initial;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
			}
		`;
	}

	if (options.backdrop) {
		dynamicCSS += `
			@media (min-width: 900px) and (min-height: 600px) {
				.${cn("modal")} {
					margin-top: 3rem;
					margin-bottom: 3rem;
					max-width: 850px;
				}
			}
		`;
	}

	let container =
		options.shadowDom !== false
			? options.container?.attachShadow({ mode: "open" })
			: options.container;

	if (!container) {
		container = document.createElement("div");
		container.classList.add("findkit");
		document.body.appendChild(container);

		if (options.shadowDom !== false) {
			container.classList.add(cn("shadow-host"));
			container = container.attachShadow({ mode: "open" });
		}
	}

	const host = container instanceof ShadowRoot ? container.host : container;

	const engine = new SearchEngine({
		...options,
		container: container,
	});

	options.events.on("dispose", () => {
		if (container) {
			ReactDOM.unmountComponentAtNode(container);
		}

		// Bailout from removing the container if we didn't create it
		if (hasCustomContainer) {
			return;
		}

		host.remove();
	});

	const fontDivisor = options.fontDivisor ?? getHtmlFontSize();

	const styles = options.layeredCSS.map((style) => {
		if (!SUPPORTS_CSS_LAYERS || options.cssLayers === false) {
			return { ...style, layer: undefined };
		}

		return style;
	});

	const coreStyles = styles.filter((style) => style.layer === "findkit.core");
	const userStyles = styles.filter((style) => style.layer !== "findkit.core");

	coreStyles.push({ css: dynamicCSS, layer: "findkit.core" });

	// Generates
	// --findkit--font-8: 0.5rem;
	// --findkit--font-12: 0.75rem;
	// --findkit--font-16: 1rem;
	// --findkit--font-24: 1.5rem;
	// --findkit--font-42: 2rem;
	const fontSizes = [8, 12, 16, 24, 32]
		.map((value) => `--findkit--font-${value}: ${value / fontDivisor}rem;`)
		.join("\n");

	ReactDOM.render(
		<StrictMode>
			<>
				<Style css={`:host, :root {\n${fontSizes}\n}`} />

				{coreStyles.map((style) => {
					return <Style key={style.href} {...style} />;
				})}

				{userStyles.map((style) => {
					return <Style key={style.href || style.css} {...style} />;
				})}

				<FindkitProvider engine={engine} slots={options.slots ?? {}}>
					{options.modal === false ? <Plain /> : <Modal />}
				</FindkitProvider>
			</>
		</StrictMode>,
		container,
	);

	return { engine, host };
}
