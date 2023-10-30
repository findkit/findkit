import { FocusTrap } from "./focus-trap";
import React, { StrictMode, useRef, useEffect, useState } from "react";
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
import { cn, deprecationNotice, View } from "./utils";
import type { Emitter, FindkitUIEvents } from "./emitter";
import { TranslationStrings } from "./translations";
import { Slot, Slots } from "./slots";

function useScrollLock(lock: boolean) {
	useEffect(() => {
		if (!lock) {
			return;
		}

		const origHeight = window.document.documentElement.style.height;
		const origOverflow = window.document.documentElement.style.overflow;

		window.document.documentElement.style.height = "100%;";
		window.document.documentElement.style.overflow = "hidden";

		return () => {
			window.document.documentElement.style.height = origHeight;
			window.document.documentElement.style.overflow = origOverflow;
		};
	}, [lock]);
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
				outsideClickDisables: false,
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

function SearchInput() {
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
				cn="search-input"
				type="text"
				ref={inputRef}
				aria-label={t("aria-label-search-input")}
			/>
			<Spinner />
			<View
				cn={{
					["search-input-icon-container"]: true,
					["search-input-icon-container-hide"]: state.status === "fetching",
				}}
			>
				<Slot name="SearchInputIcon" props={{}} errorFallback={<Logo />}>
					{/* Too small to render the default error component. Just log the error. */}
					<Logo />
				</Slot>
			</View>
		</View>
	);
}

function CloseButton() {
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
			{t("close")} <Cross />
		</View>
	);
}

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

	useScrollLock(!unmount && state.lockScroll);

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
			<Slot
				name="Header"
				props={{ Input: SearchInput, CloseButton: CloseButton }}
			>
				<CloseButton />
				<SearchInput />
			</Slot>
		</View>
	) : null;

	const content = (
		<View cn="content">
			<FetchError />
			<Slot name="Content" props={{}}>
				<Results />
			</Slot>
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
				<Slot
					name="Layout"
					props={{
						header,
						content,
					}}
				>
					{header}
					{content}
				</Slot>
			</View>
		</View>
	);
}

export function Plain() {
	const engine = useSearchEngine();
	const state = useSearchEngineState();
	const containerKbAttrs = useContainerKeyboardAttributes();
	const view = useView();

	const header = state.header ? (
		<Slot
			name="Header"
			props={{ Input: SearchInput, CloseButton: CloseButton }}
		>
			<SearchInput />
		</Slot>
	) : null;

	const content = (
		<View cn="content">
			<FetchError />
			<Slot name="Content" props={{}}>
				<Results />
			</Slot>
		</View>
	);

	return (
		<View
			{...containerKbAttrs}
			cn={{
				container: true,
				plain: true,
				["view-groups"]: view === "groups",
				["view-single"]: view === "single",
			}}
			data-id={engine.instanceId}
		>
			<Slot name="Layout" props={{ header, content }}>
				{header}
				{content}
			</Slot>
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

/**
 * @public
 */
export function init(_options: {
	publicToken: string;
	instanceId: string;
	shadowDom?: boolean;
	css?: string;
	minTerms?: number;
	styleSheets: string[];
	slots?: Partial<Slots>;
	events: Emitter<FindkitUIEvents, unknown>;
	searchEndpoint?: string;
	params?: SearchParams;
	groups?: GroupDefinition[];
	pageScroll?: boolean;
	modal?: boolean;
	fetchCount?: number;
	container?: Element;
	lockScroll?: boolean;
	infiniteScroll?: boolean;
	header?: boolean;
	router?: SearchEngineOptions["router"];
	groupOrder?: GroupOrder;
	fontDivisor?: number;
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

	if (options.ui) {
		deprecationNotice(
			"Using deprecated `ui` constructor option. Use `translations` and `lang`instead.",
		);
	}

	if (options.groups && options.params) {
		console.error(
			"[ERROR] groups and params passed to Findkit. Use one or the other.",
		);
	}

	let css = "";

	if (options.modal === false) {
		options.pageScroll = true;
		options.lockScroll = false;
	}

	if (options.pageScroll) {
		options.lockScroll = false;
		css = `
			.findkit--modal-container {
				inset: initial;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
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
			container.classList.add("findkit--shadow-host");
			container = container.attachShadow({ mode: "open" });
		}
	}

	const host = container instanceof ShadowRoot ? container.host : container;

	const engine = new SearchEngine({
		...options,
		container: container,
		alwaysReplaceRoute: hasCustomContainer,
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
				<style
					dangerouslySetInnerHTML={{
						__html: `:host, :root {\n${fontSizes}\n}`,
					}}
				/>
				{options.styleSheets.map((href) => (
					<link key={href} rel="stylesheet" href={href} />
				))}
				{css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
				{options.css ? (
					<style dangerouslySetInnerHTML={{ __html: options.css }} />
				) : null}
				<FindkitProvider engine={engine} slots={options.slots ?? {}}>
					{options.modal === false ? <Plain /> : <Modal />}
				</FindkitProvider>
			</>
		</StrictMode>,
		container,
	);

	return { engine, host };
}
