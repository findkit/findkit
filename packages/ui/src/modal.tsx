import { FocusTrap } from "./focus-trap";
import React, { StrictMode, useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Results, FindkitProvider, Logo, Slot } from "./components";
import {
	useSearchEngineState,
	useSearchEngine,
	useInput,
	Slots,
	useTranslator,
} from "./core-hooks";

import {
	SearchEngine,
	GroupDefinition,
	SearchEngineParams,
} from "./search-engine";
import { cn, View } from "./utils";
import type { Emitter, FindkitUIEvents } from "./emitter";
import { TranslationStrings } from "./translations";

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
	containerRef: React.MutableRefObject<HTMLDivElement | null>
) {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const isOpen = state.status !== "closed";
	const trapRef = useRef<FocusTrap | null>(null);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		if (!trapRef.current && containerRef.current) {
			trapRef.current = new FocusTrap({
				containers: [containerRef.current],
				escDisables: true,
				outsideClickDisables: true,
				onAfterEnable() {
					for (const input of engine.getInputs()) {
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
	}, [containerRef, engine, isOpen]);

	return containerRef;
}

function useIsScrollingDown(
	containerRef: React.MutableRefObject<HTMLDivElement | null>,
	isActive: boolean
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

			const next = e.target.scrollTop;
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

function useDelay(show: boolean, ms: number) {
	const [status, setStatus] = useState(false);

	useEffect(() => {
		if (show) {
			setStatus(show);
		} else {
			const timer = setTimeout(() => {
				setStatus(false);
			}, ms);

			return () => {
				clearTimeout(timer);
			};
		}
	}, [ms, show]);

	return status;
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

	if (!state.error) {
		return null;
	}

	return (
		<View cn="error-container">
			<View cn="error-title" as="h1">
				Oops, something went wrong 🤦‍♂️
			</View>
			<View cn="error-message" as="pre">
				{state.error?.message}
			</View>
			<View
				as="button"
				cn="retry-button"
				type="button"
				onClick={() => engine.retry()}
			>
				Try again
			</View>
		</View>
	);
}

function SearchInput() {
	const inputRef = useInput();
	const t = useTranslator();

	return (
		<View cn="search-input-wrap">
			<View
				as="input"
				cn="search-input"
				type="text"
				ref={inputRef}
				aria-label={t("aria-label-search-input")}
			/>
			<Logo />
		</View>
	);
}

function Modal() {
	const engine = useSearchEngine();
	const state = useSearchEngineState();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const t = useTranslator();
	useFocusTrap(containerRef);

	const show = state.status !== "closed";
	const duration = 150;
	const delayed = useDelay(show, duration);
	const unmount = !delayed && !show;
	const isScrollingDown = useIsScrollingDown(containerRef, show);

	useScrollLock(!unmount);

	if (unmount) {
		return null;
	}

	const visible = show && delayed;

	const header = (
		<View cn={{ header: true, "header-hidden": isScrollingDown }}>
			<Slot name="Header" props={{}}>
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

				<SearchInput />
			</Slot>
		</View>
	);

	const content = (
		<View cn="content">
			<FetchError />
			<Results />
		</View>
	);

	return (
		<View
			ref={containerRef}
			cn={["modal", visible && "modal-visible"]}
			style={{
				["--findkit--modal-animation-duration"]: `${duration}ms`,
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
	);
}

export function Plain() {
	const header = <SearchInput />;
	const content = (
		<View cn="content">
			<FetchError />
			<Results />
		</View>
	);

	return (
		<View cn="plain">
			<Slot name="Layout" props={{ header, content }}>
				{header}
				{content}
			</Slot>
		</View>
	);
}

function createModalContainer(options: {
	shadowDom?: boolean;
	instaceId: string;
}) {
	const container = document.createElement("div");
	container.id = "findkit--modal-container-" + options.instaceId;
	document.body.appendChild(container);

	if (options.shadowDom !== false) {
		container.className = "findkit--shadow-host";
		return container.attachShadow({ mode: "open" });
	}

	return container;
}

/**
 * @public
 */
export function init(options: {
	publicToken: string;
	instanceId: string;
	shadowDom?: boolean;
	css?: string;
	minTerms?: number;
	styleSheets: string[];
	slots?: Partial<Slots>;
	events: Emitter<FindkitUIEvents>;
	searchEndpoint?: string;
	params?: SearchEngineParams;
	groups?: GroupDefinition[];
	container?: Element;
	infiniteScroll?: boolean;
	ui?: {
		lang: string;
		overrides?: Partial<TranslationStrings>;
	};
}) {
	const plainContainer = Boolean(options.container);

	let container =
		options.shadowDom !== false
			? options.container?.attachShadow({ mode: "open" })
			: options.container;

	if (!container) {
		container = createModalContainer({
			shadowDom: options.shadowDom,
			instaceId: options.instanceId,
		});
	}

	const engine = new SearchEngine(options);

	options.events.on("dispose", () => {
		if (container) {
			ReactDOM.unmountComponentAtNode(container);
		}

		if (plainContainer) {
			return;
		}

		// Remove the element from the DOM only if we created it
		if (container instanceof Element) {
			container.remove();
		} else {
			container?.host.remove();
		}
	});

	ReactDOM.render(
		<StrictMode>
			<>
				{options.styleSheets.map((href) => (
					<link key={href} rel="stylesheet" href={href} />
				))}
				{options.css ? (
					<style dangerouslySetInnerHTML={{ __html: options.css }} />
				) : null}
				<FindkitProvider engine={engine} slots={options.slots ?? {}}>
					{plainContainer ? <Plain /> : <Modal />}
				</FindkitProvider>
			</>
		</StrictMode>,
		container
	);

	return engine;
}
