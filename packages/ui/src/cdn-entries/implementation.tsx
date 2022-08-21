import { html } from "htm/preact";
import { createElement, useState } from "react";
import { useSearchEngineState } from "../core-hooks";

import { initModal } from "../modal";
import { State } from "../search-engine";

/**
 * @public
 */
export type SetStateAction<S> = S | ((prevState: S) => S);

/**
 * @public
 */
export type Dispatch<A> = (value: A) => void;

/**
 * @public
 */
export interface ModalImplementation {
	initModal: typeof initModal;
	h: (...args: any[]) => any;
	html: (strings: TemplateStringsArray, ...values: any[]) => any;
	useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
	useUIState(): ReturnType<typeof useSearchEngineState>;
}

export const implementation: ModalImplementation = {
	initModal,
	html,
	h: createElement,
	useState,
	useUIState: useSearchEngineState,
};

declare const FINDKIT_VERSION: string;
Object.assign(window, { ["FINDKIT_" + FINDKIT_VERSION]: implementation });
