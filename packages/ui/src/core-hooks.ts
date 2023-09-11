import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { FindkitURLSearchParams, SearchEngine, State } from "./search-engine";
import { useSnapshot } from "valtio";
import { Translator } from "./translations";
import { Slots } from "./slots";

/**
 * Helper state for managing focus. Focus does not affect react rendering so
 * this does not have to be part of the Valtio state
 */
export interface FocusRef {
	/**
	 * Focus the next item after the preview items
	 */
	groupViewFocusNext?: boolean;
}

export interface FindkitContextType {
	engine: SearchEngine | undefined;
	slots: Partial<Slots>;
	translator: Translator;
	focusRef: React.MutableRefObject<FocusRef>;
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

/**
 * Returns "groups" when multiple groups are shown and "single" when only one
 */
export function useView(): "groups" | "single" {
	const state = useSearchEngineState();

	if (
		state.usedGroupDefinitions.length === 1 &&
		state.usedGroupDefinitions[0]
	) {
		// Only single group defined so the view is always single
		return "single";
	} else if (state.currentGroupId) {
		// Multiple groups with a selected group. Show the single view (for that group)
		return "single";
	}

	// If there's multiple groups and no group is selected, must show the groups view
	return "groups";
}

export function useFindkitURLSearchParams(): FindkitURLSearchParams {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	return useMemo(
		() => new FindkitURLSearchParams(engine.instanceId, state.searchParams),
		[engine.instanceId, state.searchParams],
	);
}

export function useSearchEngineState(): State {
	const engine = useSearchEngine();
	// The recursive deep readonly type is too heavy. Just use the plain State type.
	return useSnapshot(engine.state as any);
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
