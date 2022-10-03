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
	useCallback<T extends Function>(
		this: void,
		callback: T,
		deps: DependencyList,
	): T;
	useState<S>(
		this: void,
		initialState: S | (() => S),
	): [S, Dispatch<SetStateAction<S>>];
	useEffect(this: void, effect: EffectCallback, deps?: DependencyList): void;
	useRef<T>(this: void, initialValue: T): MutableRefObject<T>;
	useMemo<T>(this: void, factory: () => T, deps: DependencyList | undefined): T;
	useContext<T>(this: void, context: Context<T>): T;
	createContext<T>(
		this: void,
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
