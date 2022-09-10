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
import { proxy, ref } from "valtio";
import {
	RouterBackend,
	createQueryStringBackend,
	createURLHashBackend,
	createMemoryBackend,
} from "./router";
import { Emitter, FindkitUIEvents } from "./emitter";
import { TranslationStrings } from "./translations";
import { listen, Resources } from "./resources";

const DEFAULT_HIGHLIGHT_LENGTH = 500;

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
export interface SearchEngineParams {
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
export interface GroupDefinition extends SearchEngineParams {
	id: string;
	title: string;

	previewSize?: number;
	scoreBoost?: number;
}

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

	status: "closed" | "waiting" | "fetching" | "ready";

	currentGroupId: string | undefined;

	infiniteScroll: boolean;

	/**
	 * ID of the element keyboard cursor is at
	 */
	keyboardCursor: string | undefined;

	/**
	 * Search params lang filter
	 */
	lang: string | undefined;

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

	error:
		| {
				source: "fetch" | "other";
				message: string;
		  }
		| undefined;

	resultGroups: {
		[groupId: string]: {
			hits: SearchResultHit[];
			total: number;
			duration?: number;
		};
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
			groups: GroupDefinition[],
	  ) => GroupDefinition[] | GroupDefinition | undefined | void);

/**
 * @public
 */
export type UpdateParamsArgument =
	| SearchEngineParams
	| ((params: SearchEngineParams) => SearchEngineParams | undefined | void);

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
	#params: URLSearchParams;
	#instanceId: string;

	constructor(instanceId: string, search: string) {
		this.#instanceId = instanceId;
		this.#params = new URLSearchParams(search);
	}

	getGroupId() {
		return this.#params.get(this.#instanceId + "_id")?.trim() || undefined;
	}

	next(fn: (params: FindkitURLSearchParams) => void) {
		const next = new FindkitURLSearchParams(
			this.#instanceId,
			this.#params.toString(),
		);
		fn(next);
		return next;
	}

	clearGroupId() {
		return this.next((next) => {
			next.#params.delete(next.#instanceId + "_id");
		});
	}

	clearAll() {
		return this.next((next) => {
			next.#params.delete(next.#instanceId + "_id");
			next.#params.delete(next.#instanceId + "_q");
		});
	}

	setGroupId(id: string) {
		return this.next((next) => {
			next.#params.set(next.#instanceId + "_id", id);
		});
	}

	setTerms(terms: string) {
		return this.next((next) => {
			next.#params.set(next.#instanceId + "_q", terms.trim());
		});
	}

	isActive() {
		return this.#params.has(this.#instanceId + "_q");
	}

	getTerms() {
		return (this.#params.get(this.#instanceId + "_q") || "").trim();
	}

	toString() {
		return this.#params.toString();
	}

	toURLSearchParams() {
		return this.#params;
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
	searchMoreSize?: number;
	minTerms?: number;
	events: Emitter<FindkitUIEvents>;
	groups?: GroupDefinition[];
	params?: SearchEngineParams;
	infiniteScroll?: boolean;
	container: Element | ShadowRoot;
	router?: "memory" | "querystring" | "hash" | RouterBackend;

	/**
	 * Monitor <html lang> changes
	 */
	monitorDocumentElementChanges?: boolean;
	ui?: {
		lang: string;
		overrides?: Partial<TranslationStrings>;
	};
}

/**
 * @public
 */
export class SearchEngine {
	#requestId = 0;
	#pendingRequestIds: Map<number, AbortController> = new Map();
	#inputs = [] as {
		input: HTMLInputElement;
		unbindEvents: () => void;
	}[];

	readonly router: RouterBackend;
	#fetcher: FindkitFetcher;
	readonly instanceId: string;
	readonly state: State;
	readonly publicToken: string;
	#searchEndpoint: string | undefined;
	#throttleTime: number;
	#searchMoreSize: number;
	#minTerms: number;
	/**
	 * Search terms from the input that are throttle to be used as the search
	 * terms
	 */
	#throttlingTerms = "";
	#throttleTimerID?: ReturnType<typeof setTimeout>;

	#resources = new Resources();
	#container: Element | ShadowRoot;

	events: Emitter<FindkitUIEvents>;

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
		this.#container = options.container;

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
					tagQuery: [],
					highlightLength: DEFAULT_HIGHLIGHT_LENGTH,
					scoreBoost: 1,
					previewSize: 5,
					...options.params,
				},
			];
		}

		const lang = options.ui?.lang ?? this.#getDocumentLang();

		this.state = proxy<State>({
			usedTerms: undefined,
			currentGroupId: initialSearchParams.getGroupId(),
			searchParams: this.router.getSearchParamsString(),
			lang: undefined,
			status: "closed",
			infiniteScroll: options.infiniteScroll ?? true,
			error: undefined,
			resultGroups: {},
			keyboardCursor: undefined,
			ui: {
				lang,
				strings: {
					[lang]: ref(options.ui?.overrides ?? {}),
				},
			},

			// Ensure groups are unique so mutating one does not mutate the
			// other
			usedGroupDefinitions: clone(groups),
			nextGroupDefinitions: clone(groups),
		});
		devtools(this.state);

		this.#resources.create(() =>
			subscribeKey(
				this.state,
				"nextGroupDefinitions",
				this.#handleGroupsChange,
			),
		);

		if (options.monitorDocumentElementChanges !== false) {
			this.#monitorDocumentElementLang();
		}

		this.publicToken = options.publicToken;
		this.#searchEndpoint = options.searchEndpoint;

		this.#fetcher = findkitFetch;
		this.#throttleTime = options.throttleTime ?? 200;
		this.#searchMoreSize = options.searchMoreSize ?? 20;
		this.#minTerms = options.minTerms ?? 2;

		this.#syncInputs(initialSearchParams.getTerms());

		this.#resources.create(() => this.router.listen(this.#handleAddressChange));

		this.#handleAddressChange();
	}

	setUIStrings(lang: string, overrides?: Partial<TranslationStrings>) {
		this.state.ui.lang = lang;
		if (overrides) {
			this.state.ui.strings[lang] = ref(overrides);
		}
	}

	#moveKeyboardCursor(direction: "down" | "up") {
		const currentId = this.state.keyboardCursor;

		// Up does not do anything on start
		if (!currentId && direction === "up") {
			return;
		}

		const items = this.#container.querySelectorAll("[data-kb]");

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

	#selectKeyboardCursor() {
		// Find the currently selected item
		const item = this.#container.querySelector(`[data-kb-current]`);

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
	#monitorDocumentElementLang() {
		if (typeof window === "undefined") {
			return;
		}

		const observer = new MutationObserver(() => {
			this.state.ui.lang = this.#getDocumentLang();
		});

		observer.observe(document.documentElement, {
			attributeFilter: ["lang"],
			subtree: false,
		});

		this.#resources.create(() => () => observer.disconnect());
	}

	#getDocumentLang() {
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

	#debouncedSearchTimer?: ReturnType<typeof setTimeout>;

	#emitDebouncedSearchEvent(terms: string) {
		clearTimeout(this.#debouncedSearchTimer);
		this.#debouncedSearchTimer = setTimeout(() => {
			this.events.emit("debounced-search", {
				terms,
			});
		}, 2000);
	}

	#handleAddressChange = () => {
		const currentTerms = this.findkitParams.getTerms();
		this.state.searchParams = this.router.getSearchParamsString();
		const nextParams = this.findkitParams;
		if (!this.findkitParams.isActive()) {
			this.#statusTransition("closed");
			this.#throttlingTerms = "";
			this.state.currentGroupId = undefined;
			return;
		}

		this.#statusTransition("waiting");

		const terms = nextParams.getTerms();
		const reset = terms !== currentTerms;

		this.state.currentGroupId = nextParams.getGroupId();

		void this.#fetch({ terms, reset });
	};

	#clearTimeout = () => {
		if (this.#throttleTimerID) {
			clearTimeout(this.#throttleTimerID);
			this.#throttleTimerID = undefined;
		}
	};

	updateAddressBar = (
		params: FindkitURLSearchParams,
		options?: { push?: boolean },
	) => {
		this.router.update(params.toString(), options);
	};

	#handleInputChange(terms: string, options?: { force?: boolean }) {
		if (this.#throttlingTerms === terms.trim()) {
			return;
		}

		this.#throttlingTerms = terms.trim();

		if (options?.force === true) {
			this.setTerms(this.#throttlingTerms);
			return;
		}

		if (this.#throttleTimerID) {
			return;
		}

		this.#throttleTimerID = setTimeout(() => {
			this.setTerms(this.#throttlingTerms);
		}, this.#throttleTime);
	}

	setTerms(terms: string) {
		this.#clearTimeout();
		this.updateAddressBar(this.findkitParams.setTerms(terms));
	}

	updateGroups = (groupsOrFn: UpdateGroupsArgument) => {
		let nextGroups: GroupDefinition[] = [];

		if (Array.isArray(groupsOrFn)) {
			nextGroups = groupsOrFn;
		} else if (typeof groupsOrFn === "function") {
			const replace = groupsOrFn(this.state.nextGroupDefinitions);
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
			this.updateGroups((groups) => {
				const group = groups[0];
				if (group) {
					params(group);
				}
			});
		} else {
			this.updateGroups({
				...SINGLE_GROUP_NAME,
				...params,
			});
		}
	};

	#handleGroupsChange = () => {
		this.events.emit("groups-change", {
			groups: this.state.nextGroupDefinitions,
		});

		const params = this.state.nextGroupDefinitions[0];
		assertNonNullable(params, "first group missing");

		this.events.emit("params-change", {
			params,
		});
		this.#clearTimeout();
		const terms = this.findkitParams.getTerms();
		void this.#fetch({ reset: true, terms });
	};

	#searchMoreDebounce?: ReturnType<typeof setTimeout>;

	searchMore(options?: { now?: boolean }) {
		clearTimeout(this.#searchMoreDebounce);
		if (options?.now === true) {
			this.#actualSearchMore();
		} else {
			this.#searchMoreDebounce = setTimeout(this.#actualSearchMore, 500);
		}
	}

	#actualSearchMore = () => {
		// If no usedTerms is set it means first fetch has not completed so no
		// need to fetch yet
		if (this.state.usedTerms === undefined) {
			return;
		}

		if (this.#isAllresultsFetched()) {
			return;
		}

		if (this.state.status === "ready" && this.#getSelectedGroup("next")) {
			void this.#fetch({ reset: false, terms: this.state.usedTerms ?? "" });
		}
	};

	retry() {
		this.state.error = undefined;
		void this.#fetch({ reset: true, terms: this.state.usedTerms ?? "" });
	}

	/**
	 * Aka the "from" value for append requests
	 */
	#getFetchedGroupHitCount(groupId: string): number {
		return this.state.resultGroups[groupId]?.hits.length ?? 0;
	}

	#isAllresultsFetched() {
		const group = this.#getSelectedGroup("used");
		if (group) {
			const total = this.state.resultGroups[group.id]?.total;
			return this.#getFetchedGroupHitCount(group.id) === total;
		}

		return false;
	}

	#getFindkitFetchOptions(options: {
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
				let size = group.previewSize ?? 10;
				if (options.appendGroupId) {
					size = this.#searchMoreSize;
				}

				let from = 0;
				if (options.appendGroupId && !options.reset) {
					from = this.#getFetchedGroupHitCount(options.appendGroupId);
				}

				return cleanUndefined({
					tagQuery: group.tagQuery,
					createdDecay: group.createdDecay,
					modifiedDecay: group.modifiedDecay,
					decayScale: group.decayScale,
					highlightLength: group.highlightLength ?? DEFAULT_HIGHLIGHT_LENGTH,
					lang: options.lang,
					size,
					from,
				});
			});

		const fullParams: FindkitFetchOptions = {
			q: options.terms,
			groups,
			publicToken: this.publicToken,
			searchEndpoint: this.#searchEndpoint,
		};

		return fullParams;
	}

	// Poor man's state machine
	#statusTransition(next: State["status"]) {
		const current = this.state.status;

		if (next === "closed") {
			// Search can be alway closed
			this.state.status = "closed";
		} else if (next === "ready") {
			// ready state can come only after fetching
			if (current === "fetching") {
				this.state.status = next;
			}
		} else if (next === "fetching") {
			// Can move to fething state only from intial open (waiting) or
			// after previous fetch
			if (current === "waiting" || current === "ready") {
				this.state.status = next;
			}
		} else if (next === "waiting") {
			// Initial waiting state can only appear when the modal opens and no
			// searches are made yet
			if (current === "closed") {
				this.state.status = next;
			}
		} else {
			const _: never = next;
		}

		if (current !== this.state.status) {
			this.events.emit("status-change", {
				previous: current,
				next: this.state.status,
			});
		}
	}

	#fetch = async (options: { terms: string; reset: boolean }) => {
		if (this.state.status === "closed") {
			return;
		}

		const groups = this.state.nextGroupDefinitions;
		const noGroups = groups.length === 0;
		const tooFewTerms = options.terms.length < this.#minTerms;

		if (tooFewTerms || noGroups) {
			this.state.resultGroups = {};
			this.#statusTransition("ready");
			return;
		}

		const appendGroup = this.#getSelectedGroup("next");

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

		const fullParams = this.#getFindkitFetchOptions({
			groups,
			terms: options.terms,
			appendGroupId: appendGroup?.id,
			lang: this.state.lang,
			reset: options.reset,
		});

		this.#statusTransition("fetching");

		this.#requestId += 1;
		const requestId = this.#requestId;

		const abortController = new AbortController();
		this.#pendingRequestIds.set(requestId, abortController);

		this.events.emit("fetch", { terms: options.terms });

		// await new Promise((resolve) =>
		// 	setTimeout(resolve, 1000 + Math.random() * 4000),
		// );

		const response = await this.#fetcher({
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

		// This request was already cleared as there are newer requests ready
		// before this was
		if (!this.#pendingRequestIds.has(requestId)) {
			return;
		}

		this.#pendingRequestIds.delete(requestId);

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
		for (const [pendingRequestId, abortController] of this.#pendingRequestIds) {
			if (pendingRequestId < requestId) {
				abortController.abort();
				this.#pendingRequestIds.delete(pendingRequestId);
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
			this.#addAllResults(resWithIds);
		} else {
			this.state.resultGroups = resWithIds;
			this.#emitDebouncedSearchEvent(options.terms);
		}

		if (options.reset) {
			this.state.keyboardCursor = undefined;
		}

		this.state.error = undefined;

		if (this.#pendingRequestIds.size === 0) {
			this.#statusTransition("ready");
		}

		this.#syncInputs(options.terms);
	};

	#getSelectedGroup(source: "next" | "used"): GroupDefinition | undefined {
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

	#syncInputs = (terms: string) => {
		for (const input of this.#inputs) {
			// only change input value if it does not have focus
			const activeElement =
				document.activeElement?.shadowRoot?.activeElement ??
				document.activeElement;
			if (input && input.input !== activeElement) {
				input.input.value = terms;
			}
		}
	};

	/**
	 * Bind input to search. Returns unbind function.
	 */
	bindInput = (input: HTMLInputElement) => {
		const listeners = this.#resources.child();
		const prev = this.#inputs.find((o) => o.input === input);

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
			this.#handleInputChange(input.value);
		}

		this.#resources.create(() => listeners.dispose);

		listeners.create(() =>
			listen(
				input,
				"input",
				(e) => {
					assertInputEvent(e);
					this.#handleInputChange(e.target.value);
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
					this.#moveKeyboardCursor("down");
				} else if (e.key === "ArrowUp") {
					e.preventDefault();
					this.#moveKeyboardCursor("up");
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
						this.#selectKeyboardCursor();
						return;
					}

					this.#handleInputChange(e.target.value, { force: true });
				}
			}),
		);

		this.#inputs.push({ input, unbindEvents: listeners.dispose });

		return unbind;
	};

	removeInput = (rmInput: HTMLInputElement) => {
		const input = this.#inputs.find((input) => input?.input === rmInput);
		input?.unbindEvents();

		const inputIndex = this.#inputs.findIndex((obj) => obj === input);
		if (inputIndex !== -1) {
			this.#inputs.splice(inputIndex, 1);
		}
	};

	getInputs() {
		return this.#inputs.map((input) => input.input);
	}

	#addAllResults(res: State["resultGroups"]) {
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
		this.#resources.dispose();

		for (const input of this.#inputs) {
			this.removeInput(input.input);
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
