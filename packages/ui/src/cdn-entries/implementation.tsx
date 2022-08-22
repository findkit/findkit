import { html } from "htm/preact";
import { createElement, useState } from "react";
import { useSearchEngine, useSearchEngineState } from "../core-hooks";

import { initModal } from "../modal";
import { State } from "../search-engine";
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
 * @public
 */
function useParams() {
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
function useGroups() {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	return [state.nextGroupDefinitions, engine.updateGroups] as const;
}

/**
 * @public
 */
export interface ModalImplementation {
	initModal: typeof initModal;
	h: (...args: any[]) => any;
	html: (strings: TemplateStringsArray, ...values: any[]) => any;
	useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
	useUIState(): ReturnType<typeof useSearchEngineState>;
	useParams: typeof useParams;
	useGroups: typeof useGroups;
}

export const implementation: ModalImplementation = {
	initModal,
	html,
	h: createElement,
	useState,
	useUIState: useSearchEngineState,
	useGroups,
	useParams,
};

declare const FINDKIT_VERSION: string;
Object.assign(window, { ["FINDKIT_" + FINDKIT_VERSION]: implementation });
