import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import {
	FindkitURLSearchParams,
	SearchEngine,
	SearchResultHit,
} from "./search-engine";
import { useSnapshot } from "valtio";
import { Translator } from "./translations";

/**
 * @public
 */
export interface Slots {
	/**
	 * Component override for the result item
	 */
	Hit(props: { hit: SearchResultHit }): any;

	/**
	 * Header component which hides automatically when scrolling down
	 */
	Header(props: {
		children: any;

		/**
		 * The search input element
		 */
		input: any;
		closeButton: any;
	}): any;

	/**
	 * Search result content
	 */
	Content(props: { children: any }): any;

	/**
	 * Layout component which wraps the header and content
	 */
	Layout(props: { header: React.ReactNode; content: React.ReactNode }): any;
}

export interface FindkitContextType {
	engine: SearchEngine | undefined;
	slots: Partial<Slots>;
	translator: Translator;
}

export const FindkitContext = createContext<FindkitContextType | null>(null);

export function useFindkitContext() {
	const context = useContext(FindkitContext);
	if (!context) {
		throw new Error("No findkit context provided!");
	}
	return context;
}

export function useTranslator() {
	return useFindkitContext().translator;
}

export function useSearchEngine(): SearchEngine {
	const context = useContext(FindkitContext);
	if (!context?.engine) {
		throw new Error("No search engine provided!");
	}
	return context.engine;
}

export function useFindkitURLSearchParams(): FindkitURLSearchParams {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	return useMemo(
		() => new FindkitURLSearchParams(engine.instanceId, state.searchParams),
		[engine.instanceId, state.searchParams],
	);
}

export function useSearchEngineState() {
	const engine = useSearchEngine();
	return useSnapshot(engine.state);
}

export function useSearchMoreOnReveal() {
	const engine = useSearchEngine();
	const elRef = useRef<HTMLElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	return useCallback(
		(el: HTMLElement | null) => {
			if (el === elRef.current) {
				return;
			}

			observerRef.current?.disconnect();

			if (!el) {
				return;
			}

			const observer = new IntersectionObserver(
				(entries) => {
					if (!entries[0]?.isIntersecting) {
						return;
					}

					if (!engine.state.infiniteScroll) {
						return;
					}

					if (engine.state.keyboardCursor) {
						return;
					}

					engine.searchMore();
				},
				{
					threshold: 0.2,
				},
			);

			observer.observe(el);

			observerRef.current = observer;
			elRef.current = el;
		},
		[engine],
	);
}

export function useInput() {
	const engine = useSearchEngine();

	// Keep the dom reference here
	const ref = useRef<HTMLInputElement | null>(null);

	// Read how useCallback can be used to access refs:
	// https://reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node
	// tl;dr every time useCallback() generates a new callback it will get
	// called again with the ref value OR when the underlying element changes
	return useCallback(
		(input: HTMLInputElement | null) => {
			// No change to the input element. Skip
			if (input === ref.current) {
				return;
			}

			// Remove previous input if any
			if (ref.current) {
				engine.removeInput(ref.current);
			}

			// Add new input
			if (input) {
				ref.current = input;
				engine.bindInput(input);
			}
		},
		[engine],
	);
}

/**
 * Get attributes for a keyboard navigation item
 *
 * @param id unique id of nav item
 */
export function useKeyboardItemAttributes(id: string) {
	const state = useSearchEngineState();
	const attrs: {
		"data-kb": string;
		"data-kb-current"?: string;
	} = {
		"data-kb": id,
	};

	if (state.keyboardCursor === id) {
		attrs["data-kb-current"] = "";
	}

	return attrs;
}

/**
 *  Get attributes for the keyboard navigation container
 */
export function useContainerKeyboardAttributes() {
	const state = useSearchEngineState();
	const attrs: {
		"data-kb-active"?: string;
	} = {};

	if (state.keyboardCursor) {
		attrs["data-kb-active"] = state.keyboardCursor;
	}

	return attrs;
}
