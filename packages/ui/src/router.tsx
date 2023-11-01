import {
	initNormalizedHistoryEvent,
	NORMALIZED_HISTORY_EVENT,
} from "./normalized-history-event";

/**
 * @public
 */
export interface RouterBackend<State extends {}> {
	listen(cb: () => void): () => void;
	getSearchParamsString(): string;
	formatHref(qs: string): string;
	update: (params: string, options?: { push?: boolean; state?: State }) => void;
	getState(): Partial<State> | undefined;
}

/**
 * Save router state to the URL query string using the History API
 */
export function createQueryStringBackend<
	State extends {},
>(): RouterBackend<State> {
	initNormalizedHistoryEvent();

	return {
		getSearchParamsString: () => location.search,
		update: (params, options) => {
			const next = "?" + params;

			const replacingState = options?.push === false && options.state;

			if (location.search === next && !replacingState) {
				return;
			}

			const args = [options?.state, "", next + location.hash] as const;

			if (options?.push) {
				history.pushState(...args);
			} else {
				history.replaceState(...args);
			}
		},
		listen: (cb) => {
			window.addEventListener(NORMALIZED_HISTORY_EVENT, cb);
			return () => {
				window.removeEventListener(NORMALIZED_HISTORY_EVENT, cb);
			};
		},
		formatHref: (qs) => {
			return "?" + qs;
		},
		getState: () => {
			return history.state as Partial<State> | undefined;
		},
	};
}

/**
 * Keep the router state in memory
 */
export function createMemoryBackend<State extends {}>(): RouterBackend<State> {
	let current = "";
	const listeners = new Set<() => any>();

	const emit = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	return {
		getSearchParamsString: () => current,
		update: (next) => {
			if (current === next) {
				return;
			}

			current = next;
			emit();
		},
		listen: (cb) => {
			listeners.add(cb);

			return () => {
				listeners.delete(cb);
			};
		},
		formatHref: () => {
			return "#memory";
		},
		getState: () => {
			return {};
		},
	};
}

/**
 * Save router state to the URL hash using the History API
 */
export function createURLHashBackend<State extends {}>(): RouterBackend<State> {
	initNormalizedHistoryEvent();

	const get = () => {
		// Remove leading "#""
		return window.location.hash.slice(1);
	};

	return {
		getSearchParamsString: get,
		update: (next, options) => {
			const replacingState = options?.push === false && options.state;

			if (get() === next && !replacingState) {
				return;
			}

			const args = [options?.state, "", "#" + next] as const;

			if (options?.push) {
				history.pushState(...args);
			} else {
				history.replaceState(...args);
			}
		},
		listen: (cb) => {
			window.addEventListener(NORMALIZED_HISTORY_EVENT, cb);
			return () => {
				window.removeEventListener(NORMALIZED_HISTORY_EVENT, cb);
			};
		},

		formatHref: (qs) => {
			return "#" + qs;
		},
		getState: () => {
			return history.state as Partial<State> | undefined;
		},
	};
}
