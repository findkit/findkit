import { devtools, subscribeKey } from "valtio/utils";
import {
	assertNonNullable,
	cleanUndefined,
	scrollIntoViewIfNeeded,
} from "./utils";
import {
	CustomFields,
	findkitFetch,
	FindkitSearchGroupParams,
} from "@findkit/fetch";

import { FindkitFetchOptions, FindkitSearchResponse } from "@findkit/fetch";
import { proxy, ref, snapshot } from "valtio";
import {
	RouterBackend,
	createQueryStringBackend,
	createURLHashBackend,
	createMemoryBackend,
} from "./router";
import { Emitter, FindkitUIEvents } from "./emitter";
import { TranslationStrings } from "./translations";
import { listen, Resources } from "./resources";

export const DEFAULT_HIGHLIGHT_LENGTH = 250;
export const DEFAULT_PREVIEW_SIZE = 5;

/**
 * Like the findkit result but real dates instead of the string dates
 *
 * @public
 */
export interface SearchResultHit {
	created: Date;
	modified: Date;
	score: number;
	title: string;
	url: string;
	highlight: string;
	tags: ReadonlyArray<string>;
	customFields: CustomFields;
}

export interface ResultsWithTotal {
	tagGroupId: string;
	id: string;
	hits: SearchResultHit[];
	duration?: number;
	total: number;
}

/**
 * @public
 *
 * Same as FindkitSearchGroupParams but without "from" field since it is managed
 * by the SearchEngine
 */
export interface SearchParams {
	tagQuery: string[][];
	createdDecay?: number;
	modifiedDecay?: number;
	decayScale?: string;
	highlightLength?: number;
	size?: number;
	lang?: string;
}

/**
 * Group type for the search engine
 *
 * @public
 */
export interface GroupDefinition {
	id: string;
	title: string;
	previewSize?: number;
	scoreBoost?: number;
	params: SearchParams;
}

/**
 * @public
 */
export interface ResultGroup {
	hits: SearchResultHit[];
	total: number;
	duration?: number;
}

/**
 * @public
 *
 * UI status
 */
export type Status = "closed" | "waiting" | "fetching" | "ready";

/**
 * @public
 */
export interface State {
	/**
	 * Search terms used on the last completed search
	 */
	usedTerms: string | undefined;

	/**
	 * Search groups used on the last completed search
	 */
	usedGroupDefinitions: GroupDefinition[];

	/**
	 * Search to be used on the next search
	 */
	nextGroupDefinitions: GroupDefinition[];

	/**
	 * URLbar query string aka window.location.search
	 */
	searchParams: string;

	status: Status;

	currentGroupId: string | undefined;

	infiniteScroll: boolean;

	/**
	 * Show the default modal header
	 */
	header: boolean;

	/**
	 * ID of the element keyboard cursor is at
	 */
	keyboardCursor: string | undefined;

	/**
	 * Search params lang filter
	 */
	lang: string | undefined;

	/**
	 * Active the useScrollLock() hook
	 */
	lockScroll: boolean;

	inputs: {
		el: HTMLInputElement;
		unbindEvents: () => void;
	}[];

	/**
	 * Additional elements to include in the focus trap
	 *
	 * The {el} wrapping looks weird but it is because we need to use the ref()
	 * from valtio to avoid tracking DOM element internals and still be able to
	 * referential equality check in removeFromFocusTrap() .
	 */
	trapElements: { el: HTMLElement }[];

	ui: {
		/**
		 * Language of the UI
		 */
		lang: string;

		/**
		 * UI string overrides
		 */
		strings: { [lang: string]: Partial<TranslationStrings> };
	};

	/**
	 * Result group sorting method
	 */
	groupsSortMethod: GroupSortMethod;

	error:
		| {
				source: "fetch" | "other";
				message: string;
		  }
		| undefined;

	resultGroups: {
		[groupId: string]: ResultGroup;
	};
}

/**
 * Fethcer is almost like ResultsWithTotal but it does not have the
 * "tagGroupId" property which is added on the client-side
 */
export interface FetcherResponse {
	hits: SearchResultHit;
	total: number;
}

export interface FindkitFetcher {
	(params: FindkitFetchOptions): Promise<FindkitSearchResponse>;
}

function assertInputEvent(e: {
	target?: any;
}): asserts e is { target: HTMLInputElement } {
	if (!(e.target instanceof HTMLInputElement)) {
		throw new Error("Not HTMLInputElement");
	}
}

/**
 * @public
 */
export type UpdateGroupsArgument =
	| GroupDefinition[]
	| GroupDefinition
	| ((
			...groups: GroupDefinition[]
	  ) => GroupDefinition[] | GroupDefinition | undefined | void);

/**
 * @public
 */
export type UpdateParamsArgument =
	| SearchParams
	| ((params: SearchParams) => SearchParams | undefined | void);

const instanceIds = new Set<string>();

/**
 * Object clone with poor man's fallback for old browsers
 */
function clone<T>(obj: T): T {
	if (typeof structuredClone === "function") {
		return structuredClone(obj);
	}

	return JSON.parse(JSON.stringify(obj));
}

const SINGLE_GROUP_NAME = Object.freeze({
	id: "default",
	title: "Default",
});

/**
 * @public
 */
export class FindkitURLSearchParams {
	PRIVATE_params: URLSearchParams;
	PRIVATE_instanceId: string;

	constructor(instanceId: string, search: string) {
		this.PRIVATE_instanceId = instanceId;
		this.PRIVATE_params = new URLSearchParams(search);
	}

	getGroupId() {
		return (
			this.PRIVATE_params.get(this.PRIVATE_instanceId + "_id")?.trim() ||
			undefined
		);
	}

	next(fn: (params: FindkitURLSearchParams) => void) {
		const next = new FindkitURLSearchParams(
			this.PRIVATE_instanceId,
			this.PRIVATE_params.toString(),
		);
		fn(next);
		return next;
	}

	clearGroupId() {
		return this.next((next) => {
			next.PRIVATE_params.delete(next.PRIVATE_instanceId + "_id");
		});
	}

	clearAll() {
		return this.next((next) => {
			next.PRIVATE_params.delete(next.PRIVATE_instanceId + "_id");
			next.PRIVATE_params.delete(next.PRIVATE_instanceId + "_q");
		});
	}

	setGroupId(id: string) {
		return this.next((next) => {
			next.PRIVATE_params.set(next.PRIVATE_instanceId + "_id", id);
		});
	}

	setTerms(terms: string) {
		return this.next((next) => {
			next.PRIVATE_params.set(next.PRIVATE_instanceId + "_q", terms.trim());
		});
	}

	isActive() {
		return this.PRIVATE_params.has(this.PRIVATE_instanceId + "_q");
	}

	getTerms() {
		return (
			this.PRIVATE_params.get(this.PRIVATE_instanceId + "_q") || ""
		).trim();
	}

	toString() {
		return this.PRIVATE_params.toString();
	}

	toURLSearchParams() {
		return this.PRIVATE_params;
	}
}

/**
 * @public
 */
export interface SearchEngineOptions {
	instanceId?: string;
	publicToken: string;
	searchEndpoint?: string;
	throttleTime?: number;
	lockScroll?: boolean;
	header?: boolean;
	fetchCount?: number;
	minTerms?: number;
	events: Emitter<FindkitUIEvents, unknown>;
	groups?: GroupDefinition[];
	params?: SearchParams;
	infiniteScroll?: boolean;
	container: Element | ShadowRoot;
	router?: "memory" | "querystring" | "hash" | RouterBackend;

	/**
	 * Monitor <html lang> changes
	 */
	monitorDocumentElementChanges?: boolean;
	ui?: {
		lang?: string;
		overrides?: Partial<TranslationStrings>;
	};

	groupsSortMethod: GroupSortMethod;
}

export type GroupSortMethod =
	| "relevancy"
	| "initial"
	| ((a: SortGroup, b: SortGroup) => number);
export interface SortGroup {
	group: ResultGroup;
	def: GroupDefinition;
}

/**
 * @public
 *
 * A class for the internal logic and state of the search ui
 *
 * This includes
 *
 *   - managing the search requests
 *   - input value throttling
 *   - keyboard navigation
 *   - query string monitoring
 *
 * This is basically a wrapper around a Valtio proxy object.
 *
 * The data flow is as follows:
 *   - User types in the input
 *   - The input events are throttled and the search term is copied to the query
 *    string (fdk_q by default)
 *   - A query string change is deteted and the search is triggered
 *   - Once the search completes the results are put into the Valtio state with
 *     the used search terms
 *
 * Eg. the search is always triggered from the query string change. This means
 * it is also possible to trigger the search with history.pushState() or
 * history.replaceState() and input value will updated to match it unless the
 * input is focused.
 *
 */
export class SearchEngine {
	PRIVATE_requestId = 0;
	PRIVATE_pendingRequestIds: Map<number, AbortController> = new Map();

	readonly router: RouterBackend;
	private PRIVATE_fetcher: FindkitFetcher;
	readonly instanceId: string;
	readonly state: State;
	readonly publicToken: string;
	private PRIVATE_searchEndpoint: string | undefined;
	private PRIVATE_throttleTime: number;
	private PRIVATE_fetchCount: number;
	private PRIVATE_minTerms: number;
	/**
	 * Search terms from the input that are throttle to be used as the search
	 * terms
	 */
	private PRIVATE_throttlingTerms = "";
	private PRIVATE_throttleTimerID?: ReturnType<typeof setTimeout>;

	private PRIVATE_resources = new Resources();
	private PRIVATE_container: Element | ShadowRoot;

	events: Emitter<FindkitUIEvents, unknown>;

	constructor(options: SearchEngineOptions) {
		if (typeof window === "undefined") {
			this.router = {
				listen: () => () => {},
				getSearchParamsString: () => "",
				update: () => {},
				formatHref: () => "",
			};
		} else if (options.router === "memory") {
			this.router = createMemoryBackend();
		} else if (options.router === "hash") {
			this.router = createURLHashBackend();
		} else {
			this.router = createQueryStringBackend();
		}

		this.instanceId = options.instanceId ?? "fdk";
		this.publicToken = options.publicToken;
		this.events = options.events;
		this.PRIVATE_container = options.container;

		if (instanceIds.has(this.instanceId)) {
			throw new Error(
				`[findkit] Instance id "${this.instanceId}" already exists. Pass in custom "instanceId" to avoid conflicts.`,
			);
		}

		instanceIds.add(this.instanceId);

		const initialSearchParams = new FindkitURLSearchParams(
			this.instanceId,
			this.router.getSearchParamsString(),
		);

		let groups = options.groups;

		if (!groups) {
			groups = [
				{
					...SINGLE_GROUP_NAME,
					scoreBoost: 1,
					previewSize: DEFAULT_PREVIEW_SIZE,
					params: {
						tagQuery: [],
						...options.params,
					},
				},
			];
		}

		const lang = options.ui?.lang ?? this.PRIVATE_getDocumentLang();

		this.state = proxy<State>({
			usedTerms: undefined,
			currentGroupId: initialSearchParams.getGroupId(),
			searchParams: this.router.getSearchParamsString(),
			lang: undefined,
			lockScroll: options.lockScroll ?? true,
			status: "closed",
			infiniteScroll: options.infiniteScroll ?? true,
			error: undefined,
			resultGroups: {},
			header: options.header ?? true,
			keyboardCursor: undefined,
			groupsSortMethod: options.groupsSortMethod ?? "initial", // XXX Should default be initial or relevancy ?
			ui: {
				lang,
				strings: {
					[lang]: ref(options.ui?.overrides ?? {}),
				},
			},

			trapElements: [],
			inputs: [],

			// Ensure groups are unique so mutating one does not mutate the
			// other
			usedGroupDefinitions: clone(groups),
			nextGroupDefinitions: clone(groups),
		});
		devtools(this.state);

		this.PRIVATE_resources.create(() =>
			subscribeKey(
				this.state,
				"nextGroupDefinitions",
				this.PRIVATE_handleGroupsChange,
			),
		);

		if (options.monitorDocumentElementChanges !== false) {
			this.PRIVATE_monitorDocumentElementLang();
		}

		this.publicToken = options.publicToken;
		this.PRIVATE_searchEndpoint = options.searchEndpoint;

		this.PRIVATE_fetcher = findkitFetch;
		this.PRIVATE_throttleTime = options.throttleTime ?? 200;
		this.PRIVATE_fetchCount = options.fetchCount ?? 20;
		this.PRIVATE_minTerms = options.minTerms ?? 2;

		this.PRIVATE_syncInputs(initialSearchParams.getTerms());

		this.PRIVATE_resources.create(() =>
			this.router.listen(this.PRIVATE_handleAddressChange),
		);

		this.PRIVATE_handleAddressChange();
	}

	get container() {
		return this.PRIVATE_container;
	}

	get elementHost() {
		return this.PRIVATE_container instanceof ShadowRoot
			? this.PRIVATE_container
			: document;
	}

	setUIStrings(lang: string, overrides?: Partial<TranslationStrings>) {
		this.state.ui.lang = lang;
		if (overrides) {
			this.state.ui.strings[lang] = ref(overrides);
		}
	}

	private PRIVATE_moveKeyboardCursor(direction: "down" | "up") {
		const currentId = this.state.keyboardCursor;

		// Up does not do anything on start
		if (!currentId && direction === "up") {
			return;
		}

		const items = this.PRIVATE_container.querySelectorAll("[data-kb]");

		let index: undefined | number = undefined;

		// Find the current index if the cursor is set
		if (currentId) {
			for (const [i, item] of items.entries()) {
				if (item instanceof HTMLElement && item.dataset.kb === currentId) {
					index = i;
					break;
				}
			}
		}

		if (index === undefined) {
			// Start from the first item
			index = 0;
		} else if (direction === "down") {
			index++;
		} else {
			index--;
		}

		// Disable if going back past the first item
		if (index < 0) {
			this.state.keyboardCursor = undefined;
		}

		// Go to the begining when going past the last item
		if (index > items.length - 1) {
			index = items.length - 1;
		}

		const item = items[index];
		const peek = items[index + 1];

		if (
			peek instanceof HTMLElement &&
			peek.className.includes("load-more-button")
		) {
			this.searchMore({ now: true });
		}

		if (item instanceof HTMLElement) {
			const id = item.dataset.kb;
			if (id) {
				scrollIntoViewIfNeeded(item, ".findkit--header");
				this.state.keyboardCursor = id;
			}
		}
	}

	private PRIVATE_selectKeyboardCursor() {
		// Find the currently selected item
		const item = this.PRIVATE_container.querySelector(`[data-kb-current]`);

		let actionElement: HTMLElement | undefined | null = null;

		// Select the action item which is denoted with the data-kb-action
		// attribute which can the item itself or one of its children
		if (item instanceof HTMLElement && item.dataset.kbAction) {
			actionElement = item;
		} else {
			actionElement = item?.querySelector("[data-kb-action],a,button");
		}

		// Run the onClick handler
		if (
			actionElement instanceof HTMLAnchorElement ||
			actionElement instanceof HTMLButtonElement
		) {
			this.state.keyboardCursor = undefined;
			actionElement.click();
		}
	}

	/**
	 * SPA frameworks update the <html lang> when doing client side routing with
	 * the History API. Listen to those changes
	 */
	PRIVATE_monitorDocumentElementLang() {
		if (typeof window === "undefined") {
			return;
		}

		this.PRIVATE_resources.create(() => {
			const observer = new MutationObserver(() => {
				this.state.ui.lang = this.PRIVATE_getDocumentLang();
			});

			observer.observe(document.documentElement, {
				attributeFilter: ["lang"],
				subtree: false,
			});

			return () => observer.disconnect();
		});
	}

	private PRIVATE_getDocumentLang() {
		if (typeof document === "undefined") {
			return "en";
		}

		return document.documentElement.lang.slice(0, 2).toLowerCase();
	}

	/**
	 * Access the current params in the url bar
	 */
	get findkitParams() {
		return new FindkitURLSearchParams(this.instanceId, this.state.searchParams);
	}

	formatHref(params: FindkitURLSearchParams) {
		return this.router.formatHref(params.toString());
	}

	private PRIVATE_debouncedSearchTimer?: ReturnType<typeof setTimeout>;

	private PRIVATE_emitDebouncedSearchEvent(terms: string) {
		clearTimeout(this.PRIVATE_debouncedSearchTimer);
		this.PRIVATE_debouncedSearchTimer = setTimeout(() => {
			this.events.emit("debounced-search", {
				terms,
			});
		}, 2000);
	}

	private PRIVATE_handleAddressChange = () => {
		const currentTerms = this.findkitParams.getTerms();
		this.state.searchParams = this.router.getSearchParamsString();
		const nextParams = this.findkitParams;
		if (!this.findkitParams.isActive()) {
			this.PRIVATE_statusTransition("closed");
			this.PRIVATE_throttlingTerms = "";
			this.state.currentGroupId = undefined;
			return;
		}

		this.PRIVATE_statusTransition("waiting");

		const terms = nextParams.getTerms();
		const reset = terms !== currentTerms;

		this.state.currentGroupId = nextParams.getGroupId();

		void this.PRIVATE_fetch({ terms, reset });
	};

	private PRIVATE_clearTimeout = () => {
		if (this.PRIVATE_throttleTimerID) {
			clearTimeout(this.PRIVATE_throttleTimerID);
			this.PRIVATE_throttleTimerID = undefined;
		}
	};

	updateAddressBar = (
		params: FindkitURLSearchParams,
		options?: { push?: boolean },
	) => {
		this.router.update(params.toString(), options);
	};

	private PRIVATE_handleInputChange(
		terms: string,
		options?: { force?: boolean },
	) {
		if (this.PRIVATE_throttlingTerms === terms.trim()) {
			return;
		}

		this.PRIVATE_throttlingTerms = terms.trim();

		if (options?.force === true) {
			this.setTerms(this.PRIVATE_throttlingTerms);
			return;
		}

		if (this.PRIVATE_throttleTimerID) {
			return;
		}

		this.PRIVATE_throttleTimerID = setTimeout(() => {
			this.setTerms(this.PRIVATE_throttlingTerms);
		}, this.PRIVATE_throttleTime);
	}

	setTerms(terms: string) {
		this.PRIVATE_clearTimeout();
		this.updateAddressBar(this.findkitParams.setTerms(terms));
	}

	updateGroups = (groupsOrFn: UpdateGroupsArgument) => {
		let nextGroups: GroupDefinition[] = [];

		if (Array.isArray(groupsOrFn)) {
			nextGroups = groupsOrFn;
		} else if (typeof groupsOrFn === "function") {
			const replace = groupsOrFn(...this.state.nextGroupDefinitions);
			// The function can return a completely new set of groups which are
			// used to replace the old ones
			if (replace) {
				nextGroups = Array.isArray(replace) ? replace : [replace];
			} else {
				nextGroups = this.state.nextGroupDefinitions;
			}
		} else {
			nextGroups = [groupsOrFn];
		}

		this.state.nextGroupDefinitions = nextGroups;
	};

	/**
	 * Convenience method for updating on the first group in single group
	 * scenarios
	 */
	updateParams = (params: UpdateParamsArgument) => {
		if (typeof params === "function") {
			this.updateGroups((group) => {
				params(group.params ?? {});
			});
		} else {
			this.updateGroups({
				...SINGLE_GROUP_NAME,
				params,
			});
		}
	};

	getParamsSnapshot(): SearchParams {
		const group = this.state.nextGroupDefinitions[0];
		// Avoid expensive deep readonly with the any
		return snapshot(group?.params as any) ?? {};
	}

	getGroupsSnapshot(): GroupDefinition[] {
		const groups = this.state.nextGroupDefinitions;
		// Avoid expensive deep readonly with the any
		return snapshot(groups as any) ?? [];
	}

	private PRIVATE_handleGroupsChange = () => {
		const self = this;
		this.events.emit("groups", {
			get groups() {
				return self.getGroupsSnapshot();
			},
		});

		const group = this.state.nextGroupDefinitions[0];
		assertNonNullable(group, "first group missing");

		this.events.emit("params", {
			get params() {
				return self.getParamsSnapshot();
			},
		});
		this.PRIVATE_clearTimeout();
		const terms = this.findkitParams.getTerms();
		void this.PRIVATE_fetch({ reset: true, terms });
	};

	private PRIVATE_searchMoreDebounce?: ReturnType<typeof setTimeout>;

	searchMore(options?: { now?: boolean }) {
		clearTimeout(this.PRIVATE_searchMoreDebounce);
		if (options?.now === true) {
			this.PRIVATE_actualSearchMore();
		} else {
			this.PRIVATE_searchMoreDebounce = setTimeout(
				this.PRIVATE_actualSearchMore,
				500,
			);
		}
	}

	private PRIVATE_actualSearchMore = () => {
		// If no usedTerms is set it means first fetch has not completed so no
		// need to fetch yet
		if (this.state.usedTerms === undefined) {
			return;
		}

		if (this.PRIVATE_isAllresultsFetched()) {
			return;
		}

		if (
			this.state.status === "ready" &&
			this.PRIVATE_getSelectedGroup("next")
		) {
			void this.PRIVATE_fetch({
				reset: false,
				terms: this.state.usedTerms ?? "",
			});
		}
	};

	retry() {
		this.state.error = undefined;
		void this.PRIVATE_fetch({ reset: true, terms: this.state.usedTerms ?? "" });
	}

	/**
	 * Aka the "from" value for append requests
	 */
	private PRIVATE_getFetchedGroupHitCount(groupId: string): number {
		return this.state.resultGroups[groupId]?.hits.length ?? 0;
	}

	private PRIVATE_isAllresultsFetched() {
		const group = this.PRIVATE_getSelectedGroup("used");
		if (group) {
			const total = this.state.resultGroups[group.id]?.total;
			return this.PRIVATE_getFetchedGroupHitCount(group.id) === total;
		}

		return false;
	}

	private PRIVATE_getFindkitFetchOptions(options: {
		groups: GroupDefinition[];
		lang: string | undefined;
		terms: string;
		reset: boolean | undefined;
		appendGroupId: string | undefined;
	}): FindkitFetchOptions {
		const groups: FindkitSearchGroupParams[] = options.groups
			.filter((group) => {
				if (!options.appendGroupId) {
					return true;
				}

				return group.id === options.appendGroupId;
			})
			.map((group) => {
				let size = group.previewSize ?? DEFAULT_PREVIEW_SIZE;

				if (options.appendGroupId) {
					size = this.PRIVATE_fetchCount;
				}

				let from = 0;
				if (options.appendGroupId && !options.reset) {
					from = this.PRIVATE_getFetchedGroupHitCount(options.appendGroupId);
				}

				return cleanUndefined({
					tagQuery: group.params.tagQuery ?? [],
					createdDecay: group.params.createdDecay,
					modifiedDecay: group.params.modifiedDecay,
					decayScale: group.params.decayScale,
					highlightLength:
						group.params.highlightLength ?? DEFAULT_HIGHLIGHT_LENGTH,
					lang: options.lang,
					size,
					from,
				});
			});

		const fullParams: FindkitFetchOptions = {
			q: options.terms,
			groups,
			publicToken: this.publicToken,
			searchEndpoint: this.PRIVATE_searchEndpoint,
		};

		return fullParams;
	}

	// Poor man's state machine
	private PRIVATE_statusTransition(next: State["status"]) {
		const prev = this.state.status;

		if (next === "closed") {
			// Search can be alway closed
			this.state.status = "closed";
		} else if (next === "ready") {
			// ready state can come only after fetching
			if (prev === "fetching") {
				this.state.status = next;
			}
		} else if (next === "fetching") {
			// Can move to fething state only from intial open (waiting) or
			// after previous fetch
			if (prev === "waiting" || prev === "ready") {
				this.state.status = next;
			}
		} else if (next === "waiting") {
			// Initial waiting state can only appear when the modal opens and no
			// searches are made yet
			if (prev === "closed") {
				this.state.status = next;
			}
		} else {
			const _: never = next;
		}

		const current = this.state.status;

		if (prev !== current) {
			this.events.emit("status", {
				previous: prev,
				next: current,
			});

			const container =
				this.PRIVATE_container instanceof ShadowRoot
					? this.PRIVATE_container.host
					: this.PRIVATE_container;

			// There is no "open" status because there are technically multiple
			// open states. So to fire the "open" event we need to infer it from
			// the closed state
			if (prev === "closed" && current !== "closed") {
				this.events.emit("open", { container });
			}

			if (prev !== "closed" && current === "closed") {
				this.events.emit("close", { container });
			}
		}
	}

	private PRIVATE_fetch = async (options: {
		terms: string;
		reset: boolean;
	}) => {
		if (this.state.status === "closed") {
			return;
		}

		const groups = this.state.nextGroupDefinitions;
		const noGroups = groups.length === 0;
		const tooFewTerms = options.terms.length < this.PRIVATE_minTerms;

		if (tooFewTerms || noGroups) {
			this.state.resultGroups = {};
			this.PRIVATE_statusTransition("ready");
			return;
		}

		const appendGroup = this.PRIVATE_getSelectedGroup("next");

		if (appendGroup && !options.reset) {
			const group = this.state.resultGroups[appendGroup.id];
			if (group) {
				const fetched = group.hits.length;
				const total = group.total;
				if (fetched >= total) {
					return;
				}
			}
		}

		const fullParams = this.PRIVATE_getFindkitFetchOptions({
			groups,
			terms: options.terms,
			appendGroupId: appendGroup?.id,
			lang: this.state.lang,
			reset: options.reset,
		});

		this.PRIVATE_statusTransition("fetching");

		this.PRIVATE_requestId += 1;
		const requestId = this.PRIVATE_requestId;

		const abortController = new AbortController();
		this.PRIVATE_pendingRequestIds.set(requestId, abortController);

		this.events.emit("fetch", { terms: options.terms, id: String(requestId) });

		// await new Promise((resolve) =>
		// 	setTimeout(resolve, 1000 + Math.random() * 4000),
		// );

		const response = await this.PRIVATE_fetcher({
			...fullParams,
			signal: abortController.signal,
		}).then(
			(res) => {
				return {
					ok: true as const,
					value: res,
				};
			},
			(error: any) => {
				return {
					ok: false as const,
					error,
				};
			},
		);

		const stale = !this.PRIVATE_pendingRequestIds.has(requestId);

		this.events.emit("fetch-done", {
			terms: options.terms,
			id: String(requestId),
			stale,
		});

		// This request was already cleared as there are newer requests ready
		// before this was
		if (stale) {
			return;
		}

		this.PRIVATE_pendingRequestIds.delete(requestId);

		if (!response.ok) {
			console.error("[findkit] fetch failed", response.error);
			this.state.error = {
				source: "fetch",
				message: response.error.message,
			};
			// On error just bail out and do not clear the previous results
			// so the user can see the previus results
			return;
		}

		// Remove all pending requests that were made before this one
		for (const [pendingRequestId, abortController] of this
			.PRIVATE_pendingRequestIds) {
			if (pendingRequestId < requestId) {
				abortController.abort();
				this.PRIVATE_pendingRequestIds.delete(pendingRequestId);
			}
		}

		if ((this.state.status as string) === "closed") {
			return;
		}

		// Combine responses with the search groups and re-assign the ids for them
		const resWithIds: State["resultGroups"] = {};

		fullParams.groups?.forEach((group, index) => {
			const res = response.value.groups[index];
			if (!res) {
				return;
			}

			const hits = res.hits.map((hit) => {
				const { created, modified, ...rest } = hit;
				return {
					...rest,
					created: new Date(created),
					modified: new Date(modified),
				};
			});

			let groupId;
			const indexGroup = groups[index];

			if (appendGroup) {
				groupId = appendGroup.id;
			} else if (indexGroup) {
				groupId = indexGroup.id;
			} else {
				throw new Error("[findkit] Bug? Unknown group index: " + index);
			}

			resWithIds[groupId] = {
				hits,
				total: res.total,
				duration: res.duration,
			};
		});

		// Update the state terms to match the results
		this.state.usedTerms = options.terms;
		this.state.usedGroupDefinitions = groups;

		if (appendGroup && !options.reset) {
			this.PRIVATE_addAllResults(resWithIds);
		} else {
			this.state.resultGroups = resWithIds;
			this.PRIVATE_emitDebouncedSearchEvent(options.terms);
		}

		if (options.reset) {
			this.state.keyboardCursor = undefined;
		}

		this.state.error = undefined;

		if (this.PRIVATE_pendingRequestIds.size === 0) {
			this.PRIVATE_statusTransition("ready");
		}

		this.PRIVATE_syncInputs(options.terms);
	};

	PRIVATE_getSelectedGroup(
		source: "next" | "used",
	): GroupDefinition | undefined {
		const groups =
			source === "next"
				? this.state.nextGroupDefinitions
				: this.state.usedGroupDefinitions ?? this.state.nextGroupDefinitions;

		// When using only one group we can just use the id of the first group
		if (groups.length === 1 && groups[0]) {
			return groups[0];
		}

		const id = this.findkitParams.getGroupId();
		return groups.find((group) => group.id === id);
	}

	private get PRIVATE_inputs() {
		return this.state.inputs;
	}

	private PRIVATE_syncInputs = (terms: string) => {
		for (const input of this.PRIVATE_inputs) {
			// only change input value if it does not have focus
			const activeElement =
				document.activeElement?.shadowRoot?.activeElement ??
				document.activeElement;
			if (input && input.el !== activeElement) {
				input.el.value = terms;
			}
		}
	};

	/**
	 * Bind input to search. Returns unbind function.
	 */
	bindInput = (input: HTMLInputElement) => {
		const listeners = this.PRIVATE_resources.child();
		const prev = this.PRIVATE_inputs.find((o) => o.el === input);

		const unbind = () => {
			this.removeInput(input);
		};

		if (prev) {
			return unbind;
		}

		const currentTerms = this.findkitParams.getTerms();

		if (currentTerms) {
			// Enable search results linking by copying the terms to the input
			// from url bar but skip if if the input is active so we wont mess
			// with the user too much
			if (input.value.trim() === "" || input !== document.activeElement) {
				input.value = currentTerms;
			}
		} else if (input.value.trim()) {
			// Other way around. If user manages to write something to the input
			// before this is called, use that value to make a search. This is
			// mainly for lazy loading when the input can be interacted with
			// before this .addInput() call
			this.PRIVATE_handleInputChange(input.value);
		}

		this.PRIVATE_resources.create(() => listeners.dispose);

		listeners.create(() =>
			listen(
				input,
				"input",
				(e) => {
					assertInputEvent(e);
					this.PRIVATE_handleInputChange(e.target.value);
				},
				{ passive: true },
			),
		);

		listeners.create(() =>
			listen(
				input,
				"blur",
				() => {
					this.state.keyboardCursor = undefined;
				},
				{ passive: true },
			),
		);

		listeners.create(() =>
			listen(input, "keydown", (e) => {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					this.PRIVATE_moveKeyboardCursor("down");
				} else if (e.key === "ArrowUp") {
					e.preventDefault();
					this.PRIVATE_moveKeyboardCursor("up");
				} else if (e.key === "Escape" && this.state.keyboardCursor) {
					e.preventDefault();

					// Stop event bubbling to prevent the modal from closing.  Eg.
					// first esc hit disables the keyboard navigation if active and
					// the only the second one closes the modal
					e.stopImmediatePropagation();

					this.state.keyboardCursor = undefined;

					// Input might be hidden so scroll to it to make it visible
					scrollIntoViewIfNeeded(input);
				} else if (e.key === "Enter") {
					assertInputEvent(e);

					if (this.state.keyboardCursor) {
						e.preventDefault();
						this.PRIVATE_selectKeyboardCursor();
						return;
					}

					this.PRIVATE_handleInputChange(e.target.value, { force: true });
				}
			}),
		);

		this.PRIVATE_inputs.push(
			ref({ el: input, unbindEvents: listeners.dispose }),
		);

		return unbind;
	};

	removeInput = (rmInput: HTMLInputElement) => {
		const input = this.PRIVATE_inputs.find((input) => input?.el === rmInput);
		input?.unbindEvents();

		const inputIndex = this.PRIVATE_inputs.findIndex((obj) => obj === input);
		if (inputIndex !== -1) {
			this.PRIVATE_inputs.splice(inputIndex, 1);
		}
	};

	trapFocus = (elements: HTMLElement[]) => {
		this.state.trapElements.push(...elements.map((el) => ref({ el })));
		return () => {
			return this.PRIVATE_removeFromFocusTrap(elements);
		};
	};

	private PRIVATE_removeFromFocusTrap = (elements: HTMLElement[]) => {
		this.state.trapElements = this.state.trapElements.filter((ref) => {
			return !elements.includes(ref.el);
		});
	};

	private PRIVATE_addAllResults(res: State["resultGroups"]) {
		for (const key in res) {
			const more = res[key];

			let resultGroup = this.state.resultGroups[key];

			if (!resultGroup) {
				resultGroup = {
					hits: [],
					total: more?.total ?? 0,
				};
			}

			resultGroup.hits.push(...(more?.hits ?? []));

			// Update resultsGroups in the case it was just created so Valtio
			// can detect it
			this.state.resultGroups[key] = resultGroup;
		}
	}

	open = (terms?: string) => {
		const nextTerms =
			terms === undefined ? this.findkitParams.getTerms() : terms;

		this.updateAddressBar(this.findkitParams.setTerms(nextTerms), {
			push: !this.findkitParams.isActive(),
		});
	};

	dispose = () => {
		this.events.emit("dispose", {});
		instanceIds.delete(this.instanceId);
		this.close();
		this.PRIVATE_resources.dispose();

		for (const input of this.PRIVATE_inputs) {
			this.removeInput(input.el);
		}
		this.events.dispose();
	};

	close = () => {
		if (this.state.status !== "closed") {
			this.updateAddressBar(this.findkitParams.clearAll(), {
				push: true,
			});
		}
	};
}
