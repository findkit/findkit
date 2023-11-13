import { html } from "htm/preact";
import { createElement, useMemo } from "react";
import { useInput, useSearchEngine, useSearchEngineState } from "../core-hooks";

import { init } from "../modal";
import {
	SearchParams,
	SearchResultHit,
	UpdateParamsArgument,
} from "../search-engine";
import { assertNonNullable } from "../utils";
import { preactFunctions, PreactFunctions } from "./preact-subset";

/**
 * Read and update the search params
 *
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
	init: typeof init;
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
	preact: PreactFunctions;
}

export const js: Implementation = {
	init,
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
