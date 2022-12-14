import {
	initNormalizedHistoryEvent,
	NORMALIZED_HISTORY_EVENT,
} from "./normalized-history-event";

/**
 * @public
 */
export interface RouterBackend {
	listen(cb: () => void): () => void;
	getSearchParamsString(): string;
	formatHref(qs: string): string;
	update: (params: string, options?: { push?: boolean }) => void;
}

/**
 * Save router state to the URL query string using the History API
 */
export function createQueryStringBackend(): RouterBackend {
	initNormalizedHistoryEvent();

	return {
		getSearchParamsString: () => location.search,
		update: (params, options) => {
			const next = "?" + params;
			if (location.search === next) {
				return;
			}

			const args = [undefined, "", next + location.hash] as const;

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
	};
}

/**
 * Keep the router state in memory
 */
export function createMemoryBackend(): RouterBackend {
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
	};
}

/**
 * Save router state to the URL hash using the History API
 */
export function createURLHashBackend(): RouterBackend {
	initNormalizedHistoryEvent();

	const get = () => {
		// Remove leading "#""
		return window.location.hash.slice(1);
	};

	return {
		getSearchParamsString: get,
		update: (next, options) => {
			if (get() === next) {
				return;
			}

			const args = [undefined, "", "#" + next] as const;

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
	};
}
