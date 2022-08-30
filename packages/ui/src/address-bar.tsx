/**
 * @public
 */
export interface AddressBar {
	listen(cb: () => any): () => void;
	getSearchParamsString(): string;
	update: (params: URLSearchParams, options?: { push?: boolean }) => void;
}

const CUSTOM_EVENT_NAME = "findkit-url-change";

function dispatchFindkitURLChange() {
	dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME));
}

/**
 * @public
 */
export class FindkitURLSearchParams {
	private params: URLSearchParams;
	private instanceId: string;

	constructor(instanceId: string, search: string) {
		this.instanceId = instanceId;
		this.params = new URLSearchParams(search);
	}

	getGroupId() {
		return this.params.get(this.instanceId + "_id")?.trim() || undefined;
	}

	next(fn: (params: FindkitURLSearchParams) => void) {
		const next = new FindkitURLSearchParams(
			this.instanceId,
			this.params.toString(),
		);
		fn(next);
		return next;
	}

	clearGroupId() {
		return this.next((next) => {
			next.params.delete(next.instanceId + "_id");
		});
	}

	clearAll() {
		return this.next((next) => {
			next.params.delete(next.instanceId + "_id");
			next.params.delete(next.instanceId + "_q");
		});
	}

	setGroupId(id: string) {
		return this.next((next) => {
			next.params.set(next.instanceId + "_id", id);
		});
	}

	setTerms(terms: string) {
		return this.next((next) => {
			next.params.set(next.instanceId + "_q", terms.trim());
		});
	}

	isActive() {
		return this.params.has(this.instanceId + "_q");
	}

	getTerms() {
		return (this.params.get(this.instanceId + "_q") || "").trim();
	}

	toString() {
		return this.params.toString();
	}

	toLink() {
		return "?" + this.toString();
	}

	toURLSearchParams() {
		return this.params;
	}
}

function monitorMethod<Target extends {}, Method extends keyof Target>(
	targetObject: Target,
	method: Method,
	cb: () => void,
) {
	const anyTarget = targetObject as any;
	const orginalMethod = anyTarget[method] as any;
	let disposed = false;

	const proxy = new Proxy(anyTarget[method], {
		apply: (target: any, thisArg, argArray) => {
			const res = target.apply(thisArg, argArray);
			if (!disposed) {
				cb();
			}
			return res;
		},
	});

	anyTarget[method] = proxy;

	return () => {
		disposed = true;
		// can restore old back only when no one else has overwritten it since
		if (anyTarget[method] === proxy) {
			anyTarget[method] = orginalMethod;
		}
	};
}

export function createMemoryAddressbar(): AddressBar {
	let qs = "";
	const listeners = new Set<() => any>();

	const emit = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	return {
		getSearchParamsString: () => qs,
		update: (params) => {
			const next = params.toString();

			if (qs === next) {
				return;
			}

			qs = next;
			emit();
		},
		listen: (cb) => {
			listeners.add(cb);

			return () => {
				listeners.delete(cb);
			};
		},
	};
}

let addressBarInitialized = false;

export function createAddressBar(): AddressBar {
	if (typeof window === "undefined") {
		return {
			listen: () => () => {},
			getSearchParamsString: () => "",
			update: () => {},
		};
	}

	if (!addressBarInitialized) {
		// Move to Navigation API once possible
		// https://caniuse.com/mdn-api_navigation_navigate_event
		monitorMethod(history, "pushState", dispatchFindkitURLChange);
		monitorMethod(history, "replaceState", dispatchFindkitURLChange);
		addressBarInitialized = true;
	}

	return {
		getSearchParamsString: () => location.search,
		update: (params, options) => {
			const next = "?" + params.toString();
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
		listen: (cb: Parameters<AddressBar["listen"]>[0]) => {
			if (typeof window === "undefined") {
				return () => {};
			}

			const onSearchChange = () => {
				cb();
			};

			// Convert browser back/forward button presses to Valu Search History events
			window.addEventListener("popstate", dispatchFindkitURLChange);
			window.addEventListener(CUSTOM_EVENT_NAME, onSearchChange);

			return () => {
				window.removeEventListener("popstate", dispatchFindkitURLChange);
				window.removeEventListener(CUSTOM_EVENT_NAME, onSearchChange);
			};
		},
	};
}
