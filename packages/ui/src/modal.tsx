import React, {
	StrictMode,
	useRef,
	useEffect,
	useState,
	useLayoutEffect,
	ReactNode,
} from "react";
import ReactDOM from "react-dom";
import { ResultsContent, FindkitProvider, Logo, Spinner } from "./components";
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
import { cn, getScrollContainer, View } from "./utils";
import type { Emitter, FindkitUIEvents } from "./emitter";
import { Slots } from "./slots";
import { SlotCatchBoundary, createSlotComponent } from "./slots-core";
import { listen } from "./resources";

function useFormProps() {
	const engine = useSearchEngine();
	const t = useTranslator();

	return {
		role: "search",
		id: engine.getUniqId("form"),
		["aria-label"]: t("aria-label-search-form"),
	};
}

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

function SearchInput(props: { placeholder?: string; icon?: ReactNode }) {
	const inputRef = useInput();
	const t = useTranslator();
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	let description = t("sr-search-instructions");
	if (engine.modal) {
		description = t("sr-search-instructions-modal");
	}

	return (
		<View cn="search-input-wrap">
			<View
				as="input"
				autoFocus={engine.modal}
				placeholder={props.placeholder}
				aria-description={description}
				cn="search-input"
				type="search"
				ref={inputRef}
				aria-label={t("aria-label-search-input")}
			/>
			<View
				tabIndex={-1}
				as="button"
				cn={["visible-when-focused", "submit-search-button"]}
				onKeyDown={(e) => {
					if (e.key === "Enter" && e.shiftKey) {
						e.preventDefault();
						engine.focusFirstHit();
					}
				}}
			>
				{t("submit-search")}
			</View>
			<Spinner />
			<View
				aria-hidden
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
	const t = useTranslator();
	const formProps = useFormProps();

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
			as="section"
			aria-label={t("aria-label-search-controls")}
			cn={{
				header: true,
				"header-hidden": isScrollingDown,
			}}
		>
			<HeaderSlot Input={SearchInput} CloseButton={CloseButton} />
		</View>
	) : null;

	const content = <ResultsContent />;

	return (
		<View
			data-id={engine.instanceId}
			as="form"
			{...formProps}
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
			<View
				// Do not allow focus to the scrolling container.
				// The focus on on the scrolling container is confusing as it
				// is not annouced for screen readers and it is not visible.
				// This makes sure the focus jumps to the first result
				// after a search when hitting tab key
				// The container is scrollable from the result element too
				// so this should be ok.
				tabIndex={-1}
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
	const t = useTranslator();
	const engine = useSearchEngine();
	const state = useSearchEngineState();
	const containerKbAttrs = useContainerKeyboardAttributes();
	const view = useView();
	const containerRef = useRef<HTMLFormElement | null>(null);
	const formProps = useFormProps();

	useScrollRestore(containerRef);
	useOpenCloseEvents(true);

	const header = state.header ? (
		<SlotCatchBoundary
			name="Header"
			props={{ Input: SearchInput, CloseButton: CloseButton }}
		>
			<View as="section" aria-label={t("aria-label-search-controls")}>
				<SearchInput />
			</View>
		</SlotCatchBoundary>
	) : null;

	const content = <ResultsContent />;

	return (
		<View
			as="form"
			{...formProps}
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

/*
 * CSS must be fully loaded before we can show the modal
 * for the scroll restoration to work as css affects element
 * sizes and positions and thus scroll positions
 *
 * This component waits for the CSS to be loaded and then renders
 * the children.
 */
function CSSLoadWaiter(props: { children: React.ReactNode; skip: boolean }) {
	const [loaded, setLoaded] = useState(props.skip ?? false);
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!ref.current) {
			return;
		}

		if (loaded) {
			return;
		}

		const isLoaded = getComputedStyle(ref.current).getPropertyValue(
			"--findkit--loaded",
		);

		if (isLoaded) {
			setLoaded(true);
			return;
		}

		// Just using a dummy animation which is provided by the css we load
		// on a hidden element to detect when the CSS is loaded. Because we
		// use css layers and the css @import statement the standard onload
		// event on the link element does not work.
		return listen(ref.current, "animationstart", () => {
			setLoaded(true);
		});
	}, [loaded]);

	return (
		<>
			{loaded ? (
				props.children
			) : (
				<View
					style={{
						opacity: 0,
						pointerEvents: "none",
					}}
					cn="css-load-detection"
					ref={ref}
				/>
			)}
		</>
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
	closeOnOutsideClick?: boolean;
	groups?: GroupDefinition[];
	fetchCount?: number;
	container?: Element;
	lockScroll?: boolean;
	builtinStyles?: boolean;
	infiniteScroll?: boolean;
	backdrop?: boolean;
	inert?: string;
	trap?: boolean;
	modal?: boolean;
	header?: boolean;
	router?: SearchEngineOptions["router"];
	groupOrder?: GroupOrder;
	fontDivisor?: number;
}) {
	const options = { ..._options };

	if (typeof options.modal !== "boolean") {
		options.modal = !options.container;
	}

	// Default to use history.replaceState when not using modal
	if (!options.modal && typeof options.forceHistoryReplace !== "boolean") {
		options.forceHistoryReplace = true;
	}

	const hasGroups = options.groups && options.groups.length > 0;
	if (hasGroups && options.params) {
		console.error(
			"[ERROR] Both `groups` and `params` options passed to Findkit. Use only one or the other.",
		);
	}

	let dynamicCSS = "";

	if (options.modal && typeof options.lockScroll !== "boolean") {
		options.lockScroll = true;
	}

	// options.backdrop = true;
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

	const engine = new SearchEngine(options);

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
					<CSSLoadWaiter skip={options.builtinStyles === false}>
						{options.modal ? (
							<View
								as="dialog"
								cn="dialog"
								// Only firefox moves focus to the dialog element. We actually never
								// want the dialog to be focused but the first focusable element inside it.
								tabIndex={-1}
							>
								<Modal />
							</View>
						) : (
							<Plain />
						)}
					</CSSLoadWaiter>
				</FindkitProvider>
			</>
		</StrictMode>,
		engine.container,
	);

	options.events.on("dispose", () => {
		ReactDOM.unmountComponentAtNode(engine.container);
	});

	const host =
		engine.container instanceof ShadowRoot
			? engine.container.host
			: engine.container;

	return { engine, host };
}
