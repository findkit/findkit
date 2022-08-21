/**
 * @public
 */
export interface AddressBar {
	listen(cb: () => any): () => void;
	getSearchParamsString(): string;
	update: (params: URLSearchParams, options?: { push?: boolean }) => void;
}

const CUSTOM_EVENT_NAME = "findkit-change";

function dispatchFindkitHistoryEvent() {
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
			this.params.toString()
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

export function createAddressBar(): AddressBar {
	if (typeof window === "undefined") {
		return {
			listen: () => () => {},
			getSearchParamsString: () => "",
			update: () => {},
		};
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
			dispatchFindkitHistoryEvent();
		},
		listen: (cb: Parameters<AddressBar["listen"]>[0]) => {
			if (typeof window === "undefined") {
				return () => {};
			}

			const onSearchChange = () => {
				cb();
			};

			const onPopState = () => {
				dispatchFindkitHistoryEvent();
			};

			// Convert browser back/forward button presses to Valu Search History events
			window.addEventListener("popstate", onPopState);
			window.addEventListener(CUSTOM_EVENT_NAME, onSearchChange);

			return () => {
				window.removeEventListener("popstate", onPopState);
				window.removeEventListener(CUSTOM_EVENT_NAME, onSearchChange);
			};
		},
	};
}
