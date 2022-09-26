import {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback,
	useContext,
	createContext,
} from "react";

export type SetStateAction<S> = S | ((prevState: S) => S);
export type Dispatch<A> = (value: A) => void;
type DependencyList = ReadonlyArray<any>;
type Destructor = () => void;
type EffectCallback = () => void | Destructor;
interface MutableRefObject<T> {
	current: T;
}

interface Provider<T> {
	(props: { value: T; children?: any }): any;
}

interface Consumer<T> {
	(props: { children: (value: T) => any }): any;
}

interface Context<T> {
	Provider: Provider<T>;
	Consumer: Consumer<T>;
	displayName?: string | undefined;
}

/**
 * Small subset of commonly used Preact functions
 */
export interface PreactFunctions {
	useCallback<T extends Function>(callback: T, deps: DependencyList): T;
	useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
	useEffect(effect: EffectCallback, deps?: DependencyList): void;
	useRef<T>(initialValue: T): MutableRefObject<T>;
	useMemo<T>(factory: () => T, deps: DependencyList | undefined): T;
	useContext<T>(context: Context<T>): T;
	createContext<T>(
		// If you thought this should be optional, see
		// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/24509#issuecomment-382213106
		defaultValue: T,
	): Context<T>;
}

export const preactFunctions: PreactFunctions = {
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
	useContext,
	createContext,
};
