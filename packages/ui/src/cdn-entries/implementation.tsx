// import "preact/devtools";
import { html } from "htm/preact";
import { createElement, useCallback, useMemo, useRef } from "react";
import { useInput, useSearchEngine, useSearchEngineState } from "../core-hooks";

import { init } from "../modal";
import {
	CustomRouterData,
	CustomRouterDataSetter,
	SearchParams,
	SearchResultHit,
	UpdateParamsArgument,
} from "../search-engine";
import { assertNonNullable } from "../utils";
import { preactFunctions, PreactFunctions } from "./preact-subset";

/**
 * Read and update the search params
 *
 * @public
 */
function useParamsImplementation<T extends SearchParams>(): [
	T,
	(arg: UpdateParamsArgument<T>) => void,
] {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const group = state.nextGroupDefinitions[0];
	assertNonNullable(group, "useParams(): No group defined");

	return [group.params, engine.updateParams] as any;
}

/**
 * @public
 */
function useCustomRouterDataImplementation<T extends CustomRouterData>(
	initial?: T,
): [data: T, setData: (data: CustomRouterDataSetter<T>) => void] {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const initialRef = useRef(initial);

	// getCustomRouterData() uses state.pendingCustomRouterData and
	// state.searchParams internally so we can memoize the result based on
	// those
	const data = useMemo(() => {
		return engine.getCustomRouterData(initialRef.current) ?? {};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.pendingCustomRouterData, state.searchParams]) as T;

	const setData = useCallback(
		(data: T) => {
			engine.setCustomRouterData(data, initialRef.current);
		},
		[engine],
	);

	return [data, setData] as any;
}

/**
 * Read and update the search groups
 *
 * @public
 */
function useGroupsImplementation() {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	return [state.nextGroupDefinitions, engine.updateGroups] as const;
}

/**
 * Total hit count. Includes all groups if multiple groups are used.
 */
function useTotalHitCountImplementation() {
	const state = useSearchEngineState();
	return Object.values(state.resultGroups).reduce(
		(total, group) => total + group.total,
		0,
	);
}

/**
 * @public
 */
export function useLangImplementation() {
	return useSearchEngineState().ui.lang;
}

/**
 * @public
 */
export interface SearchResultHitWithGroupId extends SearchResultHit {
	groupId: string;
}

/**
 * @public
 */
export function useTermsImplementation(): string {
	const state = useSearchEngineState();
	return state.usedTerms ?? "";
}

/**
 * @public
 */
function useLoadingImplementation() {
	return useSearchEngineState().loading;
}

/**
 * @public
 */
export function useTotalImplementation() {
	const state = useSearchEngineState();

	return useMemo(() => {
		const currentGroupId = state.currentGroupId;
		if (currentGroupId) {
			const groupResults = state.resultGroups[currentGroupId];
			return groupResults?.total ?? 0;
		}

		return Object.values(state.resultGroups).reduce((sum, group) => {
			return sum + group.total;
		}, 0);
	}, [state.currentGroupId, state.resultGroups]);
}

/**
 * @public
 */
export function useResultsImplementation(): SearchResultHitWithGroupId[] {
	const state = useSearchEngineState();

	return useMemo(() => {
		const currentGroupId = state.currentGroupId;
		return Object.entries(state.resultGroups).flatMap(([id, result]) => {
			if (currentGroupId && currentGroupId !== id) {
				return [];
			}

			return result.hits.map((hit) => {
				return {
					groupId: id,
					...hit,
				};
			});
		});
	}, [state.currentGroupId, state.resultGroups]);
}

/**
 * @public
 */
export interface Implementation {
	/**
	 * Internal. Do not use.
	 */
	_init: typeof init;
	h: (...args: any[]) => any;
	html: (strings: TemplateStringsArray, ...values: any[]) => any;
	useParams: typeof useParamsImplementation;
	useGroups: typeof useGroupsImplementation;
	useTerms: typeof useTermsImplementation;
	useResults: typeof useResultsImplementation;
	useTotal: typeof useTotalImplementation;
	useLang: typeof useLangImplementation;
	useInput: typeof useInput;
	useTotalHitCount: typeof useTotalHitCountImplementation;
	useLoading: typeof useLoadingImplementation;
	useCustomRouterData: typeof useCustomRouterDataImplementation;
	preact: PreactFunctions;
	css: (strings: TemplateStringsArray, ...expr: string[]) => string;
}

export const js: Implementation = {
	_init: init,
	css: null as any, // set always in cdn-entries/index.ts
	html,
	h: createElement,
	useGroups: useGroupsImplementation,
	useParams: useParamsImplementation,
	useTerms: useTermsImplementation,
	useTotal: useTotalImplementation,
	useResults: useResultsImplementation,
	useInput,
	useTotalHitCount: useTotalHitCountImplementation,
	useLang: useLangImplementation,
	useLoading: useLoadingImplementation,
	useCustomRouterData: useCustomRouterDataImplementation,
	preact: preactFunctions,
};

declare const FINDKIT_VERSION: string;

if (typeof window !== "undefined") {
	Object.assign(window, { ["FINDKIT_" + FINDKIT_VERSION]: js });
	const callback = (window as any)["FINDKIT_LOADED_" + FINDKIT_VERSION];
	if (typeof callback === "function") {
		callback(js);
	}
}
