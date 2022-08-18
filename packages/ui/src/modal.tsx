import { FocusTrap } from "./focus-trap";
import React, { StrictMode, useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Results, FindkitProvider, Logo } from "./components";
import {
	useSearchEngineState,
	useSearchEngine,
	useInput,
	Slots,
} from "./core-hooks";

import { SearchEngine, GroupDefinition } from "./search-engine";
import { cn, View } from "./utils";

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
					containerRef.current?.querySelector("input")?.focus();
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
	}, [engine, isOpen]);

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

		containerRef.current?.addEventListener("scroll", handleScroll, {
			passive: true,
		});

		return () => {
			containerRef.current?.removeEventListener("scroll", handleScroll);
		};
	}, [isActive]);

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

function ModalResult() {
	const engine = useSearchEngine();
	const state = useSearchEngineState();
	const inputRef = useInput();
	const containerRef = useRef<HTMLDivElement | null>(null);
	useFocusTrap(containerRef);

	const show = state.status !== "closed";
	const duration = 150;
	const delayed = useDelay(show, duration);
	const unmount = !delayed && !show;
	const isScrollingDown = useIsScrollingDown(containerRef, !unmount);

	useScrollLock(!unmount);

	if (unmount) {
		return null;
	}

	const visible = show && delayed;

	return (
		<View
			ref={containerRef}
			cn={["modal", visible && "modal-visible"]}
			style={{
				["--findkit--modal-animation-duration"]: `${duration}ms`,
			}}
		>
			<View cn={{ header: true, "header-hidden": isScrollingDown }}>
				<View
					cn="close-button"
					as="button"
					type="button"
					onClick={() => {
						engine.close();
					}}
				>
					Close <Cross />
				</View>

				<View cn="search-input-wrap">
					<View as="input" cn="search-input" type="text" ref={inputRef} />
					<Logo />
				</View>
			</View>
			<View cn="content">
				<FetchError />
				<Results />
			</View>
		</View>
	);
}
export function Modal(props: {
	publicToken?: string;
	engine?: SearchEngine;
	groups: GroupDefinition[];
	slots?: Partial<Slots>;
}) {
	return (
		<FindkitProvider
			publicToken={props.publicToken}
			slots={props.slots}
			groups={props.groups}
			engine={props.engine}
		>
			<ModalResult />
		</FindkitProvider>
	);
}

function createContainer(options: { shadowDom?: boolean }) {
	const container = document.createElement("div");
	container.id = "findkit-container";
	document.body.appendChild(container);

	if (options.shadowDom) {
		container.id = "findkit-shadow";
		return container.attachShadow({ mode: "open" });
	}

	return container;
}

/**
 * @public
 */
export function initModal(options: {
	publicToken: string;
	instanceId?: string;
	shadowDom?: boolean;
	css?: string;
	styleSheets: string[];
	groups: GroupDefinition[];
	slots?: Partial<Slots>;
}) {
	const container = createContainer({ shadowDom: options.shadowDom });

	const engine = new SearchEngine({
		publicToken: options.publicToken,
		instanceId: options.instanceId,
	});

	const elements = (
		<StrictMode>
			<>
				{options.styleSheets.map((href) => (
					<link key={href} rel="stylesheet" href={href} />
				))}
				{options.css ? (
					<style dangerouslySetInnerHTML={{ __html: options.css }} />
				) : null}

				<Modal {...options} engine={engine} />
			</>
		</StrictMode>
	);

	ReactDOM.render(elements, container);
	return engine;
}
