import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { SearchEngine, SearchResultHit } from "./search-engine";
import { useSnapshot } from "valtio";
import { FindkitURLSearchParams } from "./address-bar";

/**
 * @public
 */
export interface Slots {
	Hit: React.FC<{ hit: SearchResultHit }>;
	Header: React.FC<{}>;
}

export interface FindkitContextType {
	engine: SearchEngine | undefined;
	slots: Partial<Slots>;
	translations: unknown;
}

export const FindkitContext = createContext<FindkitContextType | null>(null);

export function useFindkitContext() {
	const context = useContext(FindkitContext);
	if (!context) {
		throw new Error("No findkit context provided!");
	}
	return context;
}

export function useSearchEngine(): SearchEngine {
	const context = useContext(FindkitContext);
	if (!context?.engine) {
		throw new Error("No search engine provided!");
	}
	return context.engine;
}

export function useFindkitURLSearchParams() {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	return useMemo(
		() => new FindkitURLSearchParams(engine.instanceId, state.searchParams),
		[engine.instanceId, state.searchParams]
	);
}

export function useSearchEngineState() {
	const engine = useSearchEngine();
	return useSnapshot(engine.state);
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
				engine.addInput(input);
			}
		},
		[engine]
	);
}
