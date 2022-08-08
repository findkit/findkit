import { html } from "htm/preact";
import { createElement, useState } from "react";

import { initModal } from "../modal";

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
}

export const implementation: ModalImplementation = {
    initModal,
    html,
    h: createElement,
    useState,
};

Object.assign(window, { NOVUS: implementation });
