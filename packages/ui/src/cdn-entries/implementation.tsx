import { html } from "htm/preact";
import { createElement, useMemo, useState } from "react";
import { useSearchEngine, useSearchEngineState } from "../core-hooks";

import { init } from "../modal";
import { SearchResultHit } from "../search-engine";
import { assertNonNullable } from "../utils";

/**
 * @public
 */
export type SetStateAction<S> = S | ((prevState: S) => S);

/**
 * @public
 */
export type Dispatch<A> = (value: A) => void;

/**
 * Read and update the search params
 *
 */
function useParamsImplementation() {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const group = state.nextGroupDefinitions[0];
	assertNonNullable(group, "useParams(): No group defined");

	return [group, engine.updateParams] as const;
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
 * @public
 */
export interface SearchResultHitWithGroupId extends SearchResultHit {
	groupId: string;
}

/**
 * @public
 */
export function useTermsImplementation() {
	const state = useSearchEngineState();
	return state.usedTerms;
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
export interface ModalImplementation {
	init: typeof init;
	h: (...args: any[]) => any;
	html: (strings: TemplateStringsArray, ...values: any[]) => any;
	useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
	useParams: typeof useParamsImplementation;
	useGroups: typeof useGroupsImplementation;
	useTerms: typeof useTermsImplementation;
	useResults: typeof useResultsImplementation;
	useTotal: typeof useTotalImplementation;
}

export const implementation: ModalImplementation = {
	init,
	html,
	h: createElement,
	useState,
	useGroups: useGroupsImplementation,
	useParams: useParamsImplementation,
	useTerms: useTermsImplementation,
	useTotal: useTotalImplementation,
	useResults: useResultsImplementation,
};

declare const FINDKIT_VERSION: string;
Object.assign(window, { ["FINDKIT_" + FINDKIT_VERSION]: implementation });
