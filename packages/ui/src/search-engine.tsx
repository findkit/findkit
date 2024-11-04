// import { devtools } from "valtio/utils";
import {
	assertNonNullable,
	assertNonZeroString,
	cleanUndefined,
	cn,
	getScrollContainer,
	scrollIntoViewIfNeeded,
} from "./utils";
import {
	CustomFields,
	createFindkitFetcher,
	FindkitSearchGroupParams,
	FindkitFetch,
	FindkitSearchParams,
} from "@findkit/fetch";

import { proxy, ref } from "valtio";
import {
	RouterBackend,
	createQueryStringBackend,
	createURLHashBackend,
	createMemoryBackend,
} from "./router";
import { Emitter, FindkitUIEvents, lazyValue } from "./emitter";
import {
	BASE_TRANSLATIONS,
	TRANSLATIONS,
	TranslationStrings,
	Translator,
} from "./translations";
import { listen, Resources } from "./resources";
import { Filter } from "./filter-type";
import {
	FetchEvent,
	FindkitUIGenerics,
	FindkitUIOptions,
	VERSION,
} from "./cdn-entries";
import { GroupResults } from "./core-hooks";
import { assertNotNil } from "@valu/assert";

export const DEFAULT_HIGHLIGHT_LENGTH = 250;
export const DEFAULT_PREVIEW_SIZE = 5;

function renderTranslation(
	msg: string,
	data?: Record<string, string | number>,
) {
	return msg.replace(/{{([^\}]+)}}/g, (_, key) => {
		return data?.[key]?.toString() ?? "[MISSING]";
	});
}

/**
 * Get the parent link element. Used to detect what link was clicked when
 * the click targets a child element of the link.
 */
function getLinkElement(el: any): HTMLAnchorElement | null {
	if (el instanceof HTMLAnchorElement) {
		return el;
	}

	if (el instanceof Element) {
		return el.closest("a");
	}

	return null;
}

function getTotalFromAllGroups(groups: { total: number }[]) {
	return groups.reduce((total, group) => total + group.total, 0);
}

export type CustomRouterDataSetter<T extends CustomRouterData> =
	| T
	| ((prevData: T) => T | void | undefined);

/**
 * Like the findkit result but real dates instead of the string dates
 *
 * @public
 */
export interface SearchResultHit {
	created: Date;
	modified: Date;
	index: number;
	score: number;
	title: string;
	url: string;
	highlight: string;
	language?: string;
	superwordsMatch: boolean;
	tags: ReadonlyArray<string>;
	customFields: CustomFields;
	content?: string;
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
 * New in v0.9.0
 *
 */
export type Sort = {
	[field: string]: {
		$order: "asc" | "desc";
	};
};

/**
 * @public
 *
 * New in v1.4.0
 *
 */
export type RandomSort = { seed: number };

/**
 * @public
 *
 * Same as FindkitSearchGroupParams but without "from" field since it is managed
 * by the SearchEngine
 */
export interface SearchParams {
	/**
	 * https://docs.findkit.com/ui/api/params#operator
	 */
	operator?: "and" | "or";

	/**
	 * https://docs.findkit.com/ui/api/params#tagQuery
	 */
	tagQuery?: string[][];

	/**
	 * https://docs.findkit.com/ui/api/params#tagBoost
	 */
	tagBoost?: { [tag: string]: number };

	/**
	 * https://docs.findkit.com/ui/api/params#createdDecay
	 */
	createdDecay?: number;

	/**
	 * https://docs.findkit.com/ui/api/params#modifiedDecay
	 */
	modifiedDecay?: number;

	/**
	 * https://docs.findkit.com/ui/api/params#decayScale
	 */
	decayScale?: string;

	/**
	 * https://docs.findkit.com/ui/api/params#highlightLength
	 */
	highlightLength?: number;

	/**
	 * https://docs.findkit.com/ui/api/params#size
	 */
	size?: number;

	/**
	 * New in v0.15.0
	 *
	 * https://docs.findkit.com/ui/api/params#skip
	 */
	skip?: boolean;

	/**
	 * https://docs.findkit.com/ui/api/params#lang
	 */
	lang?: string;

	/**
	 * EXPERIMENTAL
	 *
	 * Return the hit content as well
	 */
	content?: boolean;

	/**
	 * New in v0.9.0
	 *
	 * Filter search results with complex operators
	 *
	 * See {@link Filter}
	 *
	 * https://docs.findkit.com/ui/api/params#filter
	 *
	 */
	filter?: Filter;

	/**
	 * Execute semantic search
	 */
	semantic?: {
		mode: "only" | "hybrid" | "hybrid2";
		weight?: number;
		k?: number;
	};

	/**
	 * New in v0.9.0
	 *
	 * Sort search results
	 *
	 * See {@link Sort}
	 *
	 * https://docs.findkit.com/ui/api/params#sort
	 *
	 */
	sort?: Sort | Sort[];

	/**
	 * New in v.1.4.0
	 *
	 * Return search results in random order
	 *
	 * See {@link RandomSort}
	 *
	 * https://docs.findkit.com/ui/api/params#randomSort
	 */
	randomSort?: RandomSort;
}

export interface SearchParamsWithDefaults extends SearchParams {
	sort: Sort;
	filter: Filter;
	tagBoost: { [tag: string]: number };
}

/**
 * Group type for the search engine
 *
 * @public
 */
export interface GroupDefinition<
	SearchParamsT extends SearchParams = SearchParams,
> {
	id?: string;
	title?: string;
	previewSize?: number;
	relevancyBoost?: number;
	params?: SearchParamsT;
}

/**
 * Group type for the search engine
 *
 * @public
 */
export interface GroupDefinitionWithDefaults extends GroupDefinition {
	id: string;
	title: string;
	params: SearchParams;
}

/**
 * Internal search engine state type. See GroupResult for the public type.
 */
export interface EngineResultGroup {
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
	usedGroupDefinitions: GroupDefinitionWithDefaults[];

	/**
	 * Search to be used on the next search
	 */
	nextGroupDefinitions: GroupDefinitionWithDefaults[];

	/**
	 * URLbar query string aka window.location.search
	 */
	searchParams: string;

	status: Status;

	loading: boolean;

	canAnnounceResults: boolean;

	announceResultsMessage: { key: number; text: string };

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

	ui: {
		/**
		 * Language of the UI
		 */
		lang: string;

		/**
		 * UI string translation overrides
		 */
		translations: { [lang: string]: Partial<TranslationStrings> };
	};

	/**
	 * Result group sorting method
	 */
	groupOrder: GroupOrder;

	error: { source: "fetch" | "other"; message: string } | undefined;

	resultGroups: {
		[groupId: string]: EngineResultGroup;
	};

	/**
	 * Messages returned from the search-endpoint which are rendered before the
	 * search results
	 */
	messages: { id: string; message: string }[];

	pendingCustomRouterData: CustomRouterData | undefined;
}

/**
 * Fethcer is almost like ResultsWithTotal but it does not have the
 * "tagGroupId" property which is added on the client-side
 */
export interface FetcherResponse {
	hits: SearchResultHit;
	total: number;
}

function assertInputEvent(e: {
	target?: any;
}): asserts e is { target: HTMLInputElement } {
	if (!(e.target instanceof HTMLInputElement)) {
		throw new Error("Not HTMLInputElement");
	}
}

/**
 * Extract user defined groups or default to tuple of single group
 */
export type GroupsOrDefault<
	T extends FindkitUIGenerics,
	O extends FindkitUIOptions<T>,
> = undefined extends T["groups"]
	? undefined extends O["groups"]
		? [GroupDefinitionWithDefaults]
		: NonNullable<O["groups"]>
	: NonNullable<T["groups"]>;

export type SearchParamsOrDefault<
	T extends FindkitUIGenerics,
	O extends FindkitUIOptions<T>,
> = undefined extends T["params"]
	? undefined extends O["params"]
		? SearchParamsWithDefaults
		: NonNullable<O["params"]>
	: NonNullable<T["params"]>;

/**
 * @public
 */
export type UpdateGroupsArgument<T extends GroupDefinition[]> =
	| GroupDefinition[]
	| ((...groups: T) => T | undefined | void);

/**
 * @public
 */
export type UpdateParamsArgument<T extends SearchParams> =
	| Partial<T>
	| ((params: T) => T | undefined | void);

/**
 * InstanceIds, searchKeys, groupKeys, customRouterDataPrefixes
 * Reserved keys cannot clash within Findkit instance or instances
 */
const reservedKeys = new Set<{ type: string; key: string }>();

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
	title: "Default",
});

/**
 * @public
 */
export interface CustomRouterData {
	[key: string]: string | undefined;
}

/**
 * @public
 */
export class FindkitURLSearchParams {
	private PRIVATE_params: URLSearchParams;
	private PRIVATE_instanceId: string;
	private PRIVATE_customDataPrefix: string;
	private PRIVATE_separator: string;
	private PRIVATE_groupKey?: string;
	private PRIVATE_searchKey?: string;

	constructor(options: {
		instanceId: string;
		search: string;
		separator: string;
		groupKey?: string;
		searchKey?: string;
		customRouterDataPrefix?: string;
	}) {
		assertNonZeroString(
			options.instanceId,
			"Empty instanceId. See https://findk.it/instanceid",
		);
		assertNonZeroString(
			options.separator,
			"Empty separator. See https://findk.it/separator",
		);
		assertNonZeroString(
			options.searchKey,
			"Empty searchKey. See https://findk.it/searchkey",
		);
		assertNonZeroString(
			options.groupKey,
			"Empty groupKey. See https://findk.it/groupkey",
		);
		assertNonZeroString(
			options.customRouterDataPrefix,
			"Empty customRouterDataPrefix. See https://findk.it/customrouterdataprefix",
		);

		this.PRIVATE_instanceId = options.instanceId;
		this.PRIVATE_params = new URLSearchParams(options.search);
		this.PRIVATE_separator = options.separator;
		this.PRIVATE_groupKey = options.groupKey;
		this.PRIVATE_searchKey = options.searchKey;

		// ex. fdk_c_
		this.PRIVATE_customDataPrefix =
			options.customRouterDataPrefix ??
			this.PRIVATE_instanceId +
				this.PRIVATE_separator +
				"c" +
				this.PRIVATE_separator;
	}

	private PRIVATE_search_key() {
		return (
			this.PRIVATE_searchKey ??
			this.PRIVATE_instanceId + this.PRIVATE_separator + "q"
		);
	}

	private PRIVATE_group_key() {
		return (
			this.PRIVATE_groupKey ??
			this.PRIVATE_instanceId + this.PRIVATE_separator + "id"
		);
	}

	setCustomData(data: CustomRouterData) {
		return this.next((next) => {
			for (const key of this.PRIVATE_params.keys()) {
				if (key.startsWith(this.PRIVATE_customDataPrefix)) {
					next.PRIVATE_params.delete(key);
				}
			}

			for (const [key, value] of Object.entries(data)) {
				if (value !== undefined) {
					next.PRIVATE_params.set(next.PRIVATE_customDataPrefix + key, value);
				}
			}
		});
	}

	customDataEquals(other: FindkitURLSearchParams) {
		return deepEqual(this.getCustomData(), other.getCustomData());
	}

	equals(other: FindkitURLSearchParams) {
		return (
			this.getTerms() === other.getTerms() &&
			this.getGroupId() === other.getGroupId() &&
			this.customDataEquals(other)
		);
	}

	getCustomData(): CustomRouterData | undefined {
		const customData: CustomRouterData = {};

		for (const [key, value] of this.PRIVATE_params.entries()) {
			// never return the search key as custom data
			if (key === this.PRIVATE_search_key()) {
				continue;
			}
			if (key.startsWith(this.PRIVATE_customDataPrefix)) {
				const cleaned = key.slice(this.PRIVATE_customDataPrefix.length);
				customData[cleaned] = value;
			}
		}

		return Object.keys(customData).length === 0 ? undefined : customData;
	}

	getGroupId() {
		return (
			this.PRIVATE_params.get(this.PRIVATE_group_key())?.trim() || undefined
		);
	}

	next(fn: (params: FindkitURLSearchParams) => void) {
		const next = new FindkitURLSearchParams({
			instanceId: this.PRIVATE_instanceId,
			search: this.PRIVATE_params.toString(),
			separator: this.PRIVATE_separator,
			groupKey: this.PRIVATE_groupKey,
			searchKey: this.PRIVATE_searchKey,
			customRouterDataPrefix: this.PRIVATE_customDataPrefix,
		});
		fn(next);
		return next;
	}

	clearGroupId() {
		return this.next((next) => {
			next.PRIVATE_params.delete(next.PRIVATE_group_key());
		});
	}

	clearAll() {
		return this.next((next) => {
			for (const key of this.PRIVATE_params.keys()) {
				if (
					key.startsWith(this.PRIVATE_customDataPrefix) ||
					key.startsWith(this.PRIVATE_instanceId + this.PRIVATE_separator)
				) {
					next.PRIVATE_params.delete(key);
				}
			}
		});
	}

	setGroupId(id: string) {
		return this.next((next) => {
			next.PRIVATE_params.set(next.PRIVATE_group_key(), id);
		});
	}

	setTerms(terms: string) {
		return this.next((next) => {
			next.PRIVATE_params.set(next.PRIVATE_search_key(), terms.trim());
		});
	}

	isActive() {
		return this.PRIVATE_params.has(this.PRIVATE_search_key());
	}

	getTerms(): string | undefined {
		return this.PRIVATE_params.get(this.PRIVATE_search_key())?.trim();
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
	defaultCustomRouterData?: CustomRouterData;
	publicToken: string;
	searchEndpoint?: string;
	fetchThrottle?: number;
	lockScroll?: boolean;
	header?: boolean;
	fetchCount?: number;
	minTerms?: number;
	events: Emitter<FindkitUIEvents, unknown>;
	groups?: GroupDefinition[];
	params?: SearchParams;
	infiniteScroll?: boolean;
	container?: Element;
	modal?: boolean;
	inert?: string | boolean;
	shadowDom?: boolean;
	forceHistoryReplace?: boolean;
	manageScroll?: boolean;
	closeOnOutsideClick?: boolean;
	router?: "memory" | "querystring" | "hash" | RouterBackend<{}>;
	separator?: string;
	searchKey?: string;
	groupKey?: string;
	customRouterDataPrefix?: string;

	/**
	 * Monitor <html lang> changes
	 */
	monitorDocumentLang?: boolean;

	lang?: string;
	translations?: { [lang: string]: Partial<TranslationStrings> };

	groupOrder?: GroupOrder;
}

export type GroupOrder =
	| "relevancy"
	| "static"
	| ((a: GroupResults, b: GroupResults) => number);

/**
 * State for history.state
 */
interface ScopedHistoryState {
	restoreId?: string;
	scrollTop?: number;
	visitedHitId?: string;
}

interface GlobalHistoryState {
	[instanceId: string]: ScopedHistoryState | undefined;
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
	readonly closeOnOutsideClick: boolean;

	private readonly PRIVATE_router: RouterBackend<GlobalHistoryState>;
	private PRIVATE_fetcher: FindkitFetch;

	readonly instanceId: string;
	readonly separator: string;
	readonly searchKey?: string;
	readonly groupKey?: string;
	readonly customRouterDataPrefix?: string;

	readonly state: State;
	readonly publicToken: string;
	private PRIVATE_searchEndpoint: string | undefined;
	private PRIVATE_fetchThrottle: number;
	private PRIVATE_throttleId = 1;
	private PRIVATE_fetchCount: number;
	private PRIVATE_minTerms: number;
	/**
	 * Search terms from the input that are throttle to be used as the search
	 * terms
	 */
	private PRIVATE_throttlingTerms: string | null = null;
	private PRIVATE_termsThrottleTimer?: ReturnType<typeof setTimeout>;
	private PRIVATE_groupsThrottleTimer?: ReturnType<typeof setTimeout>;

	private PRIVATE_resources = new Resources();
	private PRIVATE_container: Element | ShadowRoot;
	readonly modal: boolean;
	private PRIVATE_shadowDom: boolean | undefined;
	private PRIVATE_inert: string | boolean;
	private PRIVATE_monitorDocumentLangActive: boolean | undefined;
	private PRIVATE_manageScroll: boolean | undefined;

	private PRIVATE_defaultCustomRouteData: CustomRouterData;

	private PRIVATE_forceHistoryReplace: boolean;

	events: Emitter<FindkitUIEvents, unknown>;

	constructor(options: SearchEngineOptions) {
		this.PRIVATE_defaultCustomRouteData = options.defaultCustomRouterData ?? {};
		this.PRIVATE_manageScroll = options.manageScroll;
		this.modal = options.modal ?? true;
		this.PRIVATE_shadowDom = options.shadowDom ?? true;
		this.PRIVATE_inert = options.inert ?? true;
		this.closeOnOutsideClick = options.closeOnOutsideClick ?? false;

		// Default to "_" because it works with WordPress.
		// For example Wordpress converts dots to underscores in query strings
		// using a redirect.which break opening a page with existing search terms.
		// Ex. https://wordpress.org/?what.the.fak
		// WordPress is so popular that we must choose the defaults to work with it.
		this.separator = options.separator ?? "_";

		this.searchKey = options.searchKey;
		this.groupKey = options.groupKey;
		this.customRouterDataPrefix = options.customRouterDataPrefix;

		if (typeof window === "undefined") {
			this.PRIVATE_router = {
				listen: () => () => {},
				getSearchParamsString: () => "",
				update: () => {},
				formatHref: () => "",
				getState: () => ({}),
			};
		} else if (options.router === "memory") {
			this.PRIVATE_router = createMemoryBackend();
		} else if (options.router === "hash") {
			this.PRIVATE_router = createURLHashBackend();
		} else {
			this.PRIVATE_router = createQueryStringBackend();
		}

		this.instanceId = options.instanceId ?? "fdk";
		this.publicToken = options.publicToken;
		this.events = options.events;

		this.PRIVATE_handleCustomInert();
		this.PRIVATE_restoreFocusOnModalClose();

		this.PRIVATE_handleOutsideClick();

		this.PRIVATE_container = this.PRIVATE_createContainer(options.container);

		this.PRIVATE_monitorDocumentLangActive = options.monitorDocumentLang;
		this.PRIVATE_forceHistoryReplace = options.forceHistoryReplace ?? false;

		const existingId = reservedKeys
			.keys()
			.find((reserved) => reserved.key === this.instanceId);
		if (existingId) {
			throw new Error(
				`[findkit] Conflicting instance id "${this.instanceId}". Key was already reserved for ${existingId.key} earlier. See https://findk.it/instanceid`,
			);
		}
		reservedKeys.add({ type: "instanceId", key: this.instanceId });

		// reserve the defaults too
		reservedKeys.add({
			type: "defaultSearchKey",
			key: this.instanceId + this.separator + "q",
		});
		reservedKeys.add({
			type: "defaultGroupKey",
			key: this.instanceId + this.separator + "id",
		});
		reservedKeys.add({
			type: "defaultCustomRouterDataPrefix",
			key: this.instanceId + this.separator + "c" + this.separator,
		});

		if (this.searchKey) {
			const existingKey = reservedKeys
				.keys()
				.find((reserved) => reserved.key === this.searchKey);
			if (existingKey) {
				throw new Error(
					`[findkit] Conflicting search key "${this.searchKey}". Key was already reserved for ${existingKey.type}. See https://findk.it/searchkey`,
				);
			}
			reservedKeys.add({
				type: "searchKey",
				key: this.searchKey,
			});
		}

		if (this.groupKey) {
			const existingKey = reservedKeys
				.keys()
				.find((reserved) => reserved.key === this.groupKey);
			if (existingKey) {
				throw new Error(
					`[findkit] Conflicting group key "${this.groupKey}". Key was already reserved for ${existingKey.type}. See https://findk.it/groupkey`,
				);
			}
			reservedKeys.add({
				type: "groupKey",
				key: this.groupKey,
			});
		}

		if (this.customRouterDataPrefix) {
			const existingKey = reservedKeys
				.keys()
				.find((reserved) => reserved.key === this.customRouterDataPrefix);
			if (existingKey) {
				throw new Error(
					`[findkit] Conflicting custom router data prefix "${this.customRouterDataPrefix}". Key was already reserved for ${existingKey.type}. See https://findk.it/customrouterdataprefix`,
				);
			}
			reservedKeys.add({
				type: "customRouterDataPrefix",
				key: this.customRouterDataPrefix,
			});
		}

		let groups = options.groups;

		if (!groups) {
			groups = [
				{
					...SINGLE_GROUP_NAME,
					relevancyBoost: 1,
					previewSize: DEFAULT_PREVIEW_SIZE,
					params: {
						tagQuery: [],
						...options.params,
					},
				},
			];
		}

		const lang = options.lang ?? this.PRIVATE_getDocumentLang();

		const translations: State["ui"]["translations"] = {
			[lang]: ref({}) as {},
		};

		for (const [lang, translation] of Object.entries(
			options.translations ?? {},
		)) {
			translations[lang] = ref(translation);
		}

		this.state = proxy<State>({
			usedTerms: undefined,
			currentGroupId: undefined,
			searchParams: this.PRIVATE_router.getSearchParamsString(),
			lang: undefined,
			canAnnounceResults: false,
			announceResultsMessage: { key: 1, text: "" },
			lockScroll: options.lockScroll ?? true,
			status: "closed",
			loading: false,
			infiniteScroll: options.infiniteScroll ?? true,
			error: undefined,
			resultGroups: {},
			header: options.header ?? true,
			keyboardCursor: undefined,
			groupOrder: options.groupOrder ?? "static",
			ui: {
				lang,
				translations,
			},

			inputs: [],

			messages: [],
			pendingCustomRouterData: undefined,

			// Ensure groups are unique so mutating one does not mutate the
			// other
			usedGroupDefinitions: ref(ensureDefaults(clone(groups))),
			nextGroupDefinitions: ref(ensureDefaults(clone(groups))),
		});

		// devtools(this.state);

		this.PRIVATE_resources.create(() =>
			this.PRIVATE_router.listen(this.PRIVATE_handleAddressChange),
		);

		this.publicToken = options.publicToken;
		this.PRIVATE_searchEndpoint = options.searchEndpoint;

		this.PRIVATE_fetcher = createFindkitFetcher({
			publicToken: this.publicToken,
			searchEndpoint: this.PRIVATE_searchEndpoint,
		}).fetch;

		this.PRIVATE_fetchThrottle = options.fetchThrottle ?? 200;
		this.PRIVATE_fetchCount = options.fetchCount ?? 20;
		this.PRIVATE_minTerms = options.minTerms ?? 2;
	}

	private PRIVATE_handleOutsideClick() {
		if (!this.modal) {
			return;
		}

		if (this.closeOnOutsideClick !== true) {
			return;
		}

		this.events.on("open", () => {
			setTimeout(() => {
				// The open event is emitted during the the click event that opens the
				// modal. So if we immediately bind click listener to Document element
				// it will capture the ongoing click event and close the modal immediately.
				// To work around this we wait for the next event loop tick to bind the click listener.
				const unbind = listen(document, "click", (e) => {
					if (!(e.target instanceof Element)) {
						return;
					}

					const container =
						this.container instanceof ShadowRoot
							? this.container.host
							: this.container;

					if (
						container === e.target ||
						this.PRIVATE_getBoundInput(e.target) ||
						this.container.contains(e.target)
					) {
						return;
					}

					this.close();
				});

				this.events.once("close", unbind);
			});
		});
	}

	PRIVATE_getBoundInput(el: Element | null | undefined) {
		if (!el) {
			return false;
		}

		return this.PRIVATE_inputs.find((input) => input.el === el);
	}

	/**
	 * Restore focus to the previously active element when the modal is closed
	 */
	PRIVATE_restoreFocusOnModalClose() {
		if (!this.modal) {
			return;
		}

		let previouslyFocusedElement: HTMLElement | null = null;

		this.events.on("open", () => {
			const activeElement = this.PRIVATE_getActiveElement();

			// only HTMLInputElement can be focused
			if (activeElement instanceof HTMLElement) {
				previouslyFocusedElement = activeElement;
			}

			const openedFromBoundInput = this.PRIVATE_getBoundInput(
				previouslyFocusedElement,
			);

			// Even when the <dialog> is in non-modal mode it will receive the
			// focus on open. Since we use the non-modal mode for offset
			// modals where the input is outside the dialog, we need to manually
			// keep to focus on the input on open
			if (openedFromBoundInput) {
				const unbind = listen(
					document,
					"focusin",
					(e) => {
						if (e.target instanceof HTMLDialogElement) {
							previouslyFocusedElement?.focus();
						}
					},
					{ once: true },
				);

				this.events.once("close", unbind);
			}
		});

		this.events.on("close", () => {
			previouslyFocusedElement?.focus();
			previouslyFocusedElement = null;
		});
	}

	/**
	 * Handle setting custom inert elements
	 */
	PRIVATE_handleCustomInert() {
		if (
			typeof this.PRIVATE_inert !== "string" ||
			this.PRIVATE_inert.trim() === ""
		) {
			return;
		}

		const inertSelector: string = this.PRIVATE_inert;

		const inerts = new Set<HTMLElement>();

		this.events.on("open", () => {
			for (const element of document.querySelectorAll(inertSelector)) {
				if (!(element instanceof HTMLElement)) {
					continue;
				}

				// The findkit host element itself should not ever be made inert
				if (element.classList.contains(cn("host"))) {
					continue;
				}

				// Do not add user managed inert elements to the set so they
				// won't be made non-inert on the close event
				if (element.inert) {
					continue;
				}

				if (inerts.has(element)) {
					continue;
				}

				inerts.add(element);
				element.inert = true;
			}
		});

		this.events.on("close", () => {
			for (const el of inerts.values()) {
				el.inert = false;
			}
			inerts.clear();
		});
	}

	PRIVATE_getDialog() {
		const dialog = this.container.querySelector("." + cn("dialog"));
		if (dialog instanceof HTMLDialogElement) {
			return dialog;
		}
	}

	getUniqId(
		id: "form" | "error" | "results-heading" | `hit-${string}-${number}`,
	) {
		return this.instanceId + "-" + id;
	}

	saveVisitedHitId(hitId: string) {
		this.PRIVATE_setHistoryState({ visitedHitId: hitId });
	}

	/**
	 * Set the initial focus when the dialog is opened or when
	 * back button is pressed from a search result page
	 */
	private PRIVATE_setInitialFocus() {
		if (this.state.status === "closed") {
			return;
		}

		const active = this.PRIVATE_getActiveElement();
		if (
			active instanceof HTMLAnchorElement &&
			active.closest("." + cn("hit"))
		) {
			// No need to modify the focus if it is already inside a <a> element
			// inside a hit container
			return;
		}

		const hitId = this.PRIVATE_getHistoryState()?.visitedHitId;
		if (hitId) {
			// Hit id is in the title link but when using the Hit
			// slot override it might be missing. In that case we
			// look for the hit id in the data attribute of the hit
			// container and capture the first link
			const hit = this.elementHost.querySelector(
				`#${hitId},[data-hit-id=${hitId}] a`,
			);
			if (hit instanceof HTMLAnchorElement) {
				hit.focus();
				this.PRIVATE_setHistoryState({ visitedHitId: undefined });
				return;
			}
		}

		// Do not focus the input when the search is embedded in a page with
		// custom container as the user might have other priorities for focusing
		if (!this.modal) {
			return;
		}

		const el = this.container.querySelector("[autofocus]");
		if (el instanceof HTMLElement) {
			el.focus();
		} else {
			this.PRIVATE_inputs[0]?.el.focus();
		}
	}

	PRIVATE_createContainer(customContainer: Element | undefined) {
		// A "pageshow" event with e.persisted === true is fired when
		// the paged is restored from the bfcache (back-forward cache).
		// Ensure the focus is updated in that case too.
		this.events.on("open", () => {
			// no types for pageshow event :(
			const unbind = listen(
				window,
				"pageshow" as any,
				(e: { persisted: boolean }) => {
					if (e.persisted) {
						this.PRIVATE_setInitialFocus();
					}
				},
			);
			this.events.once("close", unbind);
		});

		if (!this.modal && customContainer) {
			this.events.once("open", () => {
				this.PRIVATE_setInitialFocus();
			});
			if (this.PRIVATE_shadowDom) {
				return customContainer.attachShadow({ mode: "open" });
			}
			return customContainer;
		}

		let hostElement = customContainer;
		if (!hostElement) {
			hostElement = document.createElement("div");
			hostElement.classList.add(cn("host"));
			(hostElement as HTMLDivElement).style.position = "absolute";
			document.body.appendChild(hostElement);
		}

		const shadowRoot = this.PRIVATE_shadowDom
			? hostElement.attachShadow({ mode: "open" })
			: hostElement;

		this.events.on("open", () => {
			const undindFocusSetting = listen(this.elementHost, "focusin", () => {
				this.PRIVATE_setInitialFocus();
			});

			const unbindEscListener = listen(document, "keydown", (e) => {
				if (e.key === "Escape" && this.state.status !== "closed") {
					e.preventDefault();
					this.close();
				}
			});

			this.events.once("close", () => {
				undindFocusSetting();
				unbindEscListener();
			});

			if (typeof this.PRIVATE_inert === "boolean" && this.PRIVATE_inert) {
				this.PRIVATE_getDialog()?.showModal();
			} else {
				this.PRIVATE_getDialog()?.show();
			}

			// Firefox moves to focus to the <dialog> element but does not
			// fire the focusin event. We need to manually set the focus here
			this.PRIVATE_setInitialFocus();

			// Clear the safari fixer so focus can move normally again
			setTimeout(undindFocusSetting, 0);
		});

		this.events.on("close", () => {
			this.PRIVATE_getDialog()?.close();
		});

		return shadowRoot;
	}

	private PRIVATE_started = lazyValue<true>();

	private PRIVATE_scrollThrottle?: ReturnType<typeof setTimeout>;

	private PRIVATE_previousRestoreId?: string;

	/**
	 * Save scroll position to the current history state.
	 * Throttled unless `options.now` is true. Too many updates can
	 * make the browser unresponsive.
	 */
	private PRIVATE_saveScroll = (options?: { now?: boolean }) => {
		const save = () => {
			clearTimeout(this.PRIVATE_scrollThrottle);
			this.PRIVATE_scrollThrottle = undefined;

			if (!this.PRIVATE_getfindkitParams().isActive()) {
				return;
			}

			// Generate restore id too for saving and restoring the search
			// results. We can do it here because it is needed only when
			// the user has scrolled.
			const restoreId =
				this.PRIVATE_getHistoryState()?.restoreId ||
				Math.random().toString(36).substring(7);

			// We must store the the previous restore id because on some cases,
			// like when pressing the back button on FinkditUI Modal, the
			// history has been already changed but we still need to save the
			// results to session storage with correct restore id. With this
			// property it is possible to save it even after the history
			// change.
			this.PRIVATE_previousRestoreId = restoreId;

			this.PRIVATE_setHistoryState({
				restoreId: restoreId,
				scrollTop: this.PRIVATE_getScrollContainer().scrollTop,
			});
		};

		if (options?.now) {
			save();
			return;
		}

		if (this.PRIVATE_scrollThrottle) {
			return;
		}

		this.PRIVATE_scrollThrottle = setTimeout(save, 200);
	};

	/**
	 * "Start the search engine" eg. start listening to input, url etc.
	 * changes.
	 *
	 * This is in separate method so the users can modify the engine
	 * state before it starts listening to changes. For example this allows
	 * users to modify the ui object with updateParams() in the "loaded" and
	 * "language" event without extra search reqeusts.
	 */
	start() {
		this.PRIVATE_resources.create(() =>
			listen(this.elementHost, "scroll", () => this.PRIVATE_saveScroll(), {
				passive: true,
				capture: true,
			}),
		);

		const handleLinkClick = (e: MouseEvent) => {
			const el = getLinkElement(e.target);

			// Not clicked on a link or element inside a link
			if (!el) {
				return;
			}

			// Save scroll on internal navigations too because we want to
			// restore the to scroll position also when navigating between
			// group and single views
			this.PRIVATE_saveScroll({ now: true });

			// Ignore internal links when saving the results because they do
			// not cause navigation away from FindkitUI
			if (this.PRIVATE_container.contains(el) && el.dataset.internal) {
				return;
			}

			// We need to save the results only when the user navigates away
			// from FindkitUI so we can restore the results and scroll postion
			this.PRIVATE_saveResults();
		};

		// Any link click in anywere in the document means potentially
		// navigating away. On MPAs the beforeunload event is fired but on SPAs
		// it does not so we must save the results on any link click
		this.PRIVATE_resources.create(() =>
			listen(document.documentElement, "click", handleLinkClick, {
				// Use capturing phase to ensure we get the event before scroll
				// changes
				capture: true,
				passive: true,
			}),
		);

		// When using shadow dom the <a> elements are not visible to the
		// documentElement listener so we need to listen to them separately
		if (this.PRIVATE_container instanceof ShadowRoot) {
			this.PRIVATE_resources.create(() =>
				listen(this.PRIVATE_container, "click", handleLinkClick, {
					capture: true,
					passive: true,
				}),
			);
		}

		const initialSearchParams = new FindkitURLSearchParams({
			instanceId: this.instanceId,
			search: this.PRIVATE_router.getSearchParamsString(),
			separator: this.separator,
			searchKey: this.searchKey,
			groupKey: this.groupKey,
			customRouterDataPrefix: this.customRouterDataPrefix,
		});

		this.state.currentGroupId = initialSearchParams.getGroupId();

		this.events.emit("lang", { lang: this.state.ui.lang });
		this.PRIVATE_emitCustomRouterData();

		if (this.PRIVATE_monitorDocumentLangActive !== false) {
			this.PRIVATE_monitorDocumentElementLang();
		}

		this.PRIVATE_syncInputs(initialSearchParams.getTerms() ?? "");

		this.PRIVATE_started.provide(true);

		// User might have called ui.open() etc. which causes address bar
		// update during the start so we don't need to here
		if (!this.PRIVATE_addressBarInitialized) {
			this.PRIVATE_handleAddressChange();
		}
	}

	get container() {
		return this.PRIVATE_container;
	}

	get elementHost() {
		return this.PRIVATE_container instanceof ShadowRoot
			? this.PRIVATE_container
			: document;
	}

	getParams(): SearchParamsWithDefaults {
		const group = this.state.nextGroupDefinitions[0];
		return group?.params ?? (ensureDefaults([{}]) as any);
	}

	getGroups(): GroupDefinition[] {
		return this.state.nextGroupDefinitions;
	}

	addTranslation(
		lang: string,
		translation: Partial<TranslationStrings>,
		custom?: Record<string, string>,
	) {
		this.state.ui.translations[lang] = ref({ ...translation, ...custom });
	}

	setLang(lang: string) {
		this.state.ui.lang = lang;
		this.events.emit("lang", { lang });
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

	createTranslator(options: {
		lang: string;
		translations: { [lang: string]: Partial<TranslationStrings> };
	}): Translator {
		const { lang, translations } = options;
		// prefer locale like "en-US" but fallback to "en" if there is not US
		// specific translations
		const short = lang.trim().toLowerCase().slice(0, 2);

		return (key, data) => {
			const translation =
				translations[lang]?.[key] ||
				translations[short]?.[key] ||
				TRANSLATIONS[lang]?.[key] ||
				TRANSLATIONS[short]?.[key] ||
				BASE_TRANSLATIONS[key];

			if (translation) {
				return renderTranslation(translation, data);
			}

			return `[${key} not translated]`;
		};
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
	private PRIVATE_monitorDocumentElementLang() {
		if (typeof window === "undefined") {
			return;
		}

		this.PRIVATE_resources.create(() => {
			const observer = new MutationObserver(() => {
				const lang = this.PRIVATE_getDocumentLang();
				if (lang !== this.state.ui.lang) {
					this.state.ui.lang = lang;
					this.events.emit("lang", { lang });
				}
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

		return document.documentElement.lang;
	}

	private PRIVATE_findkitParamsCache?: {
		str: string;
		value: FindkitURLSearchParams;
	};

	/**
	 * Access the current params in the url bar
	 */
	private PRIVATE_getfindkitParams() {
		if (this.PRIVATE_findkitParamsCache?.str === this.state.searchParams) {
			return this.PRIVATE_findkitParamsCache.value;
		}

		const value = new FindkitURLSearchParams({
			instanceId: this.instanceId,
			search: this.state.searchParams,
			separator: this.separator,
			searchKey: this.searchKey,
			groupKey: this.groupKey,
			customRouterDataPrefix: this.customRouterDataPrefix,
		});

		this.PRIVATE_findkitParamsCache = {
			str: this.state.searchParams,
			value,
		};

		return value;
	}

	formatHref(params: FindkitURLSearchParams) {
		return this.PRIVATE_router.formatHref(params.toString());
	}

	getNextTerms(): string {
		return (
			this.PRIVATE_throttlingTerms ??
			this.PRIVATE_getfindkitParams().getTerms() ??
			""
		);
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

	private PRIVATE_addressBarInitialized = false;

	/**
	 * Restored inside the Modal and Plain components
	 */
	scrollPositionRestore?: number;

	private PRIVATE_handleAddressChange = () => {
		const currentParams = this.PRIVATE_getfindkitParams();
		const currentTerms = currentParams.getTerms() ?? "";
		this.state.searchParams = this.PRIVATE_router.getSearchParamsString();

		if (
			deepEqual(
				this.state.pendingCustomRouterData,
				currentParams.getCustomData(),
			)
		) {
			this.state.pendingCustomRouterData = undefined;
		}

		if (this.PRIVATE_ignoreNextAddressbarUpdate) {
			this.PRIVATE_ignoreNextAddressbarUpdate = false;
			return;
		}

		if (!this.PRIVATE_started.get()) {
			return;
		}

		this.PRIVATE_addressBarInitialized = true;

		if (this.PRIVATE_manageScroll !== false) {
			const state = this.PRIVATE_getHistoryState();
			this.scrollPositionRestore = state?.scrollTop;
		}

		const nextParams = this.PRIVATE_getfindkitParams();

		// Clear throttling only when we are really moving from open to closed.
		// When opening we might set the throttling terms before we open.
		if (!nextParams.isActive() && currentParams.isActive()) {
			this.PRIVATE_throttlingTerms = "";
		}

		if (!nextParams.isActive()) {
			this.PRIVATE_statusTransition("closed");
			this.state.currentGroupId = undefined;
			return;
		}

		if (this.PRIVATE_started.get()) {
			this.PRIVATE_emitCustomRouterData();
		}

		this.PRIVATE_statusTransition("waiting");

		const terms = nextParams.getTerms() ?? "";
		const reset = terms !== currentTerms;

		this.state.currentGroupId = nextParams.getGroupId();

		const restored = this.PRIVATE_restoreResults();
		if (restored) {
			// Restored previously made fetch. No need to do actual fetch
			return;
		}

		void this.PRIVATE_fetch({ terms, reset });
	};

	private PRIVATE_clearTermsThrottle = () => {
		clearTimeout(this.PRIVATE_termsThrottleTimer);
		this.PRIVATE_termsThrottleTimer = undefined;
	};

	private PRIVATE_clearGroupsThrottle = () => {
		clearTimeout(this.PRIVATE_groupsThrottleTimer);
		this.PRIVATE_groupsThrottleTimer = undefined;
	};

	private PRIVATE_previousCustomRouterData?: FindkitURLSearchParams;

	private PRIVATE_emitCustomRouterData() {
		const next = this.PRIVATE_getfindkitParams();

		if (this.PRIVATE_previousCustomRouterData?.customDataEquals(next)) {
			return;
		}

		this.PRIVATE_previousCustomRouterData = next;

		this.events.emit("custom-router-data", {
			data: {
				...this.PRIVATE_defaultCustomRouteData,
				...next.getCustomData(),
			},
		});
	}

	private PRIVATE_ignoreNextAddressbarUpdate = false;

	setCustomRouterData(
		data: CustomRouterDataSetter<CustomRouterData>,
		initial?: CustomRouterData,
	) {
		if (typeof data === "function") {
			const prev = clone(this.getCustomRouterData(initial));
			this.state.pendingCustomRouterData = data(prev) || prev;
		} else {
			this.state.pendingCustomRouterData = data;
		}
	}

	getCustomRouterData(initial?: CustomRouterData) {
		return (
			this.state.pendingCustomRouterData ??
			this.PRIVATE_getfindkitParams().getCustomData() ??
			initial ??
			this.PRIVATE_defaultCustomRouteData
		);
	}

	private PRIVATE_getScrollContainer() {
		return (
			this.PRIVATE_container.querySelector(".findkit--modal") ??
			getScrollContainer(this.PRIVATE_container)
		);
	}

	private PRIVATE_setHistoryState(state: ScopedHistoryState) {
		this.PRIVATE_ignoreNextAddressbarUpdate = true;
		this.PRIVATE_router.update(this.PRIVATE_getfindkitParams().toString(), {
			push: false,
			state: {
				...this.PRIVATE_router.getState(),
				[this.instanceId]: {
					...this.PRIVATE_getHistoryState(),
					...state,
				},
			},
		});
	}

	private PRIVATE_getHistoryState() {
		return this.PRIVATE_router.getState()?.[this.instanceId];
	}

	private PRIVATE_getSessionKey(id: string) {
		return `findkit-state-${VERSION}-${this.instanceId}-${id}`;
	}

	private PRIVATE_saveResults() {
		const restoreId = this.PRIVATE_previousRestoreId;

		// Not scrolled, no need to save results because we save results to be
		// able to restore scroll position with full content height
		if (!restoreId) {
			return;
		}

		const hasSomeHits = Object.values(this.state.resultGroups).some(
			(group) => group.hits.length > 0,
		);

		if (!hasSomeHits) {
			return;
		}

		const replacer = (key: string, value: any) => {
			if (
				value !== null &&
				!Array.isArray(value) &&
				typeof value === "object"
			) {
				return Object.fromEntries(
					Object.entries(value).map(([key, value]) => {
						if (value instanceof Date) {
							const newValue = "_FDK_DATE:" + value.toISOString();
							return [key, newValue];
						}

						return [key, value];
					}),
				);
			}

			return value;
		};

		sessionStorage.setItem(
			this.PRIVATE_getSessionKey(restoreId),

			JSON.stringify({ resultGroups: this.state.resultGroups }, replacer),
		);
	}

	private PRIVATE_restoreResults(): boolean {
		// Restore results from the session storage only when we don't any any
		// results in memory as it might interfere with some search customizations
		if (getTotalFromAllGroups(Object.values(this.state.resultGroups)) > 0) {
			return false;
		}

		const id = this.PRIVATE_getHistoryState()?.restoreId;

		if (!id) {
			return false;
		}

		const json = sessionStorage.getItem(this.PRIVATE_getSessionKey(id));
		if (!json) {
			return false;
		}

		sessionStorage.removeItem(this.PRIVATE_getSessionKey(id));

		let savedState: {
			resultGroups: State["resultGroups"];
		};

		try {
			const reviver = (key: string, value: any) => {
				if (
					value &&
					typeof value === "string" &&
					value.startsWith("_FDK_DATE:")
				) {
					const revivedDate = new Date(value.slice("_FDK_DATE:".length));
					return revivedDate;
				}
				return value;
			};
			savedState = JSON.parse(json, reviver);
		} catch {
			return false;
		}

		if (!savedState) {
			return false;
		}

		this.state.resultGroups = savedState.resultGroups;
		this.state.status = "ready";
		this.state.usedGroupDefinitions = this.state.nextGroupDefinitions;
		this.state.usedTerms = this.PRIVATE_getfindkitParams().getTerms();
		return true;
	}

	updateAddressBar = (
		next: FindkitURLSearchParams,
		options?: {
			push?: boolean;
			ignore?: boolean;
		},
	) => {
		if (next.equals(this.PRIVATE_getfindkitParams())) {
			return;
		}

		if (options?.ignore) {
			this.PRIVATE_ignoreNextAddressbarUpdate = true;
		}

		const push = this.PRIVATE_forceHistoryReplace ? false : options?.push;

		this.PRIVATE_router.update(next.toString(), {
			push,
			state: push ? {} : this.PRIVATE_router.getState(),
		});
	};

	/**
	 * Make search immedialtely by flushing the throttling terms
	 */
	private PRIVATE_searchNow() {
		const terms = this.PRIVATE_throttlingTerms;

		if (terms) {
			this.setTerms(terms);
		}
	}

	/**
	 * In some cases the form might be submitted multiple times
	 * in a same tick. Ensure that we only submit once.
	 */
	private PRIVATE_submitting = false;

	private PRIVATE_submitAction() {
		if (this.PRIVATE_submitting) {
			return;
		}
		this.PRIVATE_submitting = true;
		this.PRIVATE_searchNow();
		this.PRIVATE_announceResults();
		setTimeout(() => {
			this.PRIVATE_submitting = false;
		}, 0);
	}

	private PRIVATE_handleInputChange(terms: string) {
		if (this.PRIVATE_throttlingTerms === terms.trim()) {
			return;
		}

		this.PRIVATE_throttleId++;

		this.PRIVATE_throttlingTerms = terms.trim();

		if (this.PRIVATE_termsThrottleTimer) {
			return;
		}

		this.PRIVATE_termsThrottleTimer = setTimeout(() => {
			this.setTerms(this.PRIVATE_throttlingTerms ?? "");
		}, this.PRIVATE_fetchThrottle);
	}

	setTerms(terms: string) {
		this.PRIVATE_clearTermsThrottle();
		this.updateAddressBar(this.PRIVATE_getfindkitParams().setTerms(terms));
	}

	/**
	 * Convenience method for updating on the first group in single group
	 * scenarios
	 */
	updateParams = <T extends SearchParams>(params: UpdateParamsArgument<T>) => {
		if (typeof params === "function") {
			this.updateGroups((group) => {
				params((group.params ?? {}) as T);
			});
		} else {
			this.updateGroups([
				{
					...SINGLE_GROUP_NAME,
					params,
				},
			]);
		}
	};

	private PRIVATE_dirtyGroups = false;

	updateGroups = <T extends GroupDefinition[]>(
		groupsOrFn: UpdateGroupsArgument<T>,
	) => {
		let nextGroups: GroupDefinitionWithDefaults[] = [];

		if (Array.isArray(groupsOrFn)) {
			nextGroups = ensureDefaults(clone(groupsOrFn));
		} else if (typeof groupsOrFn === "function") {
			const cloned = ensureDefaults(clone(this.state.nextGroupDefinitions));
			const replace = groupsOrFn(...(cloned as any));
			// The function can return a completely new set of groups which are
			// used to replace the old ones
			if (replace) {
				nextGroups = ensureDefaults(
					clone(Array.isArray(replace) ? replace : [replace]),
				);
			} else {
				nextGroups = cloned;
			}
		} else {
			nextGroups = [groupsOrFn];
		}

		this.state.nextGroupDefinitions = ref(nextGroups);

		this.events.emit("groups", {
			groups: this.getGroups() as any,
		});

		const group = this.state.nextGroupDefinitions[0];
		assertNonNullable(group, "first group missing");

		this.events.emit("params", {
			params: this.getParams(),
		});

		if (this.PRIVATE_fetchEventRunning) {
			return;
		}

		this.PRIVATE_throttleId++;

		if (deepEqual(nextGroups, this.state.usedGroupDefinitions)) {
			this.PRIVATE_dirtyGroups = false;
			return;
		}

		this.PRIVATE_dirtyGroups = true;

		// Use leading invoke throttle for groups update. Eg. the first update
		// is immediate but the next ones are throttled.
		if (this.PRIVATE_groupsThrottleTimer) {
			return;
		}

		// The immediate update
		this.PRIVATE_handleGroupsChange();

		this.PRIVATE_groupsThrottleTimer = setTimeout(() => {
			this.PRIVATE_clearGroupsThrottle();
			if (this.PRIVATE_dirtyGroups) {
				this.PRIVATE_handleGroupsChange();
			}
		}, this.PRIVATE_fetchThrottle);
	};

	private PRIVATE_handleGroupsChange = () => {
		this.PRIVATE_clearGroupsThrottle();
		this.PRIVATE_dirtyGroups = false;

		const terms =
			(this.PRIVATE_throttlingTerms ||
				this.PRIVATE_getfindkitParams().getTerms()) ??
			"";

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
		void this.PRIVATE_fetch({
			reset: true,
			terms:
				this.PRIVATE_getfindkitParams().getTerms() ||
				this.state.usedTerms ||
				"",
		});
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
		groups: GroupDefinitionWithDefaults[];
		lang: string | undefined;
		terms: string;
		reset: boolean | undefined;
		appendGroupId: string | undefined;
	}): FindkitSearchParams {
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
					size = group.params.size ?? this.PRIVATE_fetchCount;
				}

				let from = 0;
				if (options.appendGroupId && !options.reset) {
					from = this.PRIVATE_getFetchedGroupHitCount(options.appendGroupId);
				}

				let lang = group.params.lang ?? options.lang;
				if (lang) {
					// The search-endpoint only understands two letter language
					// codes so we can ignore the rest if it happens to have a
					// country code like en-US for example
					lang = lang.toLowerCase().slice(0, 2);
				}

				return cleanUndefined({
					...group.params,
					tagQuery: group.params.tagQuery ?? [],
					highlightLength:
						group.params.highlightLength ?? DEFAULT_HIGHLIGHT_LENGTH,
					lang,
					size,
					from,
				});
			});

		const fullParams: FindkitSearchParams = {
			terms: options.terms,
			groups,
		};

		return fullParams;
	}

	// Poor man's state machine
	private PRIVATE_statusTransition(next: State["status"]) {
		const prev = this.state.status;

		if (next === "closed") {
			// Search can be alway closed
			this.state.status = "closed";
			this.state.resultGroups = {};
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

			if (prev !== "closed" && current === "closed") {
				this.PRIVATE_saveResults();
			}
		}
	}

	private PRIVATE_fetchEventRunning = false;

	private PRIVATE_fetch = async (options: {
		terms: string;
		reset: boolean;
	}) => {
		if (this.state.status === "closed") {
			return;
		}

		const noGroups = this.state.nextGroupDefinitions.length === 0;
		const tooFewTerms = options.terms.length < this.PRIVATE_minTerms;

		if (tooFewTerms || noGroups) {
			this.state.resultGroups = {};
			this.PRIVATE_statusTransition("ready");
			this.state.usedGroupDefinitions = this.state.nextGroupDefinitions;
			return;
		}

		const appendGroup = this.PRIVATE_getSelectedGroup("next");

		/**
		 * Is appending additional results to an group which already has
		 * results. No appendGroup means the user is in the multi group view
		 * and reset means the user changed search terms or some other filters
		 * and the next results will replace all previous results
		 */
		const isAppending = Boolean(appendGroup && !options.reset);

		if (isAppending && appendGroup) {
			const group = this.state.resultGroups[appendGroup.id];
			if (group) {
				const fetched = group.hits.length;
				const total = group.total;
				if (fetched >= total) {
					return;
				}
			}
		}

		this.PRIVATE_statusTransition("fetching");

		this.PRIVATE_requestId += 1;
		const requestId = this.PRIVATE_requestId;
		const throttleId = this.PRIVATE_throttleId;

		const abortController = new AbortController();
		this.PRIVATE_pendingRequestIds.set(requestId, abortController);

		/**
		 * Group definitions before the fetch event which might modify them
		 */
		const originalGroups = this.state.nextGroupDefinitions;
		let transientUpdate = false;

		const fetchEvent: FetchEvent<FindkitUIGenerics> = {
			terms: options.terms,
			id: String(requestId),
			transientUpdateParams: (params) => {
				transientUpdate = true;
				this.updateParams(params);
			},
			transientUpdateGroups: (...groups) => {
				transientUpdate = true;
				this.updateGroups(...groups);
			},
		};

		this.PRIVATE_fetchEventRunning = true;
		this.events.emit("fetch", fetchEvent);
		this.PRIVATE_fetchEventRunning = false;

		let groups = this.state.nextGroupDefinitions;

		const fullParams = this.PRIVATE_getFindkitFetchOptions({
			groups,
			terms: fetchEvent.terms,
			appendGroupId: appendGroup?.id,
			lang: this.state.lang,
			reset: options.reset,
		});

		if (transientUpdate) {
			groups = originalGroups;
			this.state.nextGroupDefinitions = originalGroups;
		}

		if (this.state.pendingCustomRouterData) {
			const next = this.PRIVATE_getfindkitParams().setCustomData(
				this.state.pendingCustomRouterData,
			);
			this.updateAddressBar(next, {
				push: false,
				ignore: true,
			});
		}

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

		// true when there are newer requests ready before this was. Can happen
		// due to network / search backend latency differences
		const oldResponse = !this.PRIVATE_pendingRequestIds.has(requestId);

		this.events.emit("fetch-done", {
			terms: options.terms,
			id: String(requestId),
			stale: oldResponse || throttleId !== this.PRIVATE_throttleId,
			append: isAppending,
			total: response.ok ? getTotalFromAllGroups(response.value.groups) : 0,
		});

		// Never render old results when we have newer ones
		if (oldResponse) {
			return;
		}

		this.PRIVATE_pendingRequestIds.delete(requestId);

		if (!response.ok) {
			console.error("[findkit] fetch failed", response.error);
			this.state.error = {
				source: "fetch",
				message: response.error.message,
			};

			if (this.PRIVATE_pendingRequestIds.size === 0) {
				this.PRIVATE_statusTransition("ready");
			}

			// On error just bail out and do not clear the previous results
			// so the user can see the previus results
			return;
		}

		for (const message of response.value.messages ?? []) {
			const seen = this.state.messages.some((m) => m.id === message.id);
			if (!seen) {
				this.state.messages.push(message);
			}
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

			const indexGroup = groups[index];

			let groupId;

			if (appendGroup) {
				groupId = appendGroup.id;
			} else if (indexGroup) {
				groupId = indexGroup.id;
			} else {
				throw new Error("[findkit] Bug? Unknown group index: " + index);
			}

			const startIndex = group.from ?? 0;

			const hits = res.hits.map((hit, index) => {
				const { created, modified, ...rest } = hit;
				return ref({
					...rest,
					index: startIndex + index,
					created: new Date(created),
					modified: new Date(modified),
				});
			});

			resWithIds[groupId] = {
				hits,
				total: res.total,
				duration: res.duration,
			};
		});

		// Update the state terms to match the results
		this.state.usedTerms = options.terms;
		this.state.usedGroupDefinitions = groups;

		if (isAppending) {
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

	private PRIVATE_getSelectedGroup(
		source: "next" | "used",
	): GroupDefinitionWithDefaults | undefined {
		const groups =
			source === "next"
				? this.state.nextGroupDefinitions
				: this.state.usedGroupDefinitions ?? this.state.nextGroupDefinitions;

		// When using only one group we can just use the id of the first group
		if (groups.length === 1 && groups[0]) {
			return groups[0];
		}

		const id = this.PRIVATE_getfindkitParams().getGroupId();
		return groups.find((group) => group.id === id);
	}

	private get PRIVATE_inputs() {
		return this.state.inputs;
	}

	/**
	 * Get the active element, unwrapping shadow DOM if needed
	 */
	private PRIVATE_getActiveElement(): Element | null {
		return (
			document.activeElement?.shadowRoot?.activeElement ??
			document.activeElement
		);
	}

	private PRIVATE_syncInputs = (terms: string) => {
		const activeElement = this.PRIVATE_getActiveElement();

		for (const input of this.PRIVATE_inputs) {
			// only change input value if it does not have focus
			if (input && input.el !== activeElement) {
				input.el.value = terms;
			}
		}
	};

	private PRIVATE_checkBouncingTimer?: ReturnType<typeof setTimeout>;

	private PRIVATE_checkIfCanAnnounceResults(options?: { now?: boolean }) {
		const check = () => {
			const activeElement = this.PRIVATE_getActiveElement();
			const read = Boolean(
				activeElement?.classList.contains(cn("submit-search-button")) ||
					this.PRIVATE_getBoundInput(activeElement),
			);

			if (!read) {
				this.state.announceResultsMessage.text = "";
			}

			this.state.canAnnounceResults = read;
		};

		if (options?.now) {
			clearTimeout(this.PRIVATE_checkBouncingTimer);
			check();
			return;
		}

		clearTimeout(this.PRIVATE_checkBouncingTimer);

		// Will toggle to false temporarily when jumping from valid element another
		// valid element. This is to avoid flickering of the announcement
		this.PRIVATE_checkBouncingTimer = setTimeout(check, 5);
	}

	private PRIVATE_announceResults() {
		const t = this.createTranslator(this.state.ui);

		this.PRIVATE_checkIfCanAnnounceResults({ now: true });
		if (!this.state.canAnnounceResults) {
			return;
		}

		const terms = (this.PRIVATE_throttlingTerms || this.state.usedTerms) ?? "";

		if (this.state.status === "fetching") {
			this.PRIVATE_announce(t("aria-live-loading-results"));
			this.events.once("fetch-done", () => {
				// fetch-done fires while still in fetching state.
				// Fire after a timeout to avoid infinite loop
				setTimeout(() => {
					this.PRIVATE_announceResults();
				});
			});
			return;
		}

		if (terms.length < this.PRIVATE_minTerms) {
			this.PRIVATE_announce(
				t("aria-live-too-few-search-terms", {
					minTerms: this.PRIVATE_minTerms,
				}),
			);
			return;
		}

		const allTotal = getTotalFromAllGroups(
			Object.values(this.state.resultGroups),
		);

		if (
			this.state.usedGroupDefinitions.length === 1 ||
			this.state.currentGroupId !== undefined
		) {
			const groupTotal = this.state.currentGroupId
				? this.state.resultGroups[this.state.currentGroupId]?.total
				: undefined;
			const total = groupTotal ?? allTotal;

			this.PRIVATE_announce(t("aria-live-total-results", { total }));
			if (total > 0) {
				this.PRIVATE_announce(
					t("aria-live-focus-search-results-with-shift-enter"),
				);
			}
		} else {
			const groupCount = this.state.usedGroupDefinitions.length;
			this.PRIVATE_announce(
				t("aria-live-group-result-details", {
					groupCount,
					allTotal,
				}),
			);
			if (allTotal > 0) {
				this.PRIVATE_announce(
					t("aria-live-focus-search-results-with-shift-enter"),
				);
			}
		}
	}

	PRIVATE_announceMessages: string[] = [];
	PRIVATE_announcePending = false;
	private PRIVATE_announce(message: string) {
		this.PRIVATE_announceMessages.push(message);
		if (this.PRIVATE_announcePending) {
			return;
		}

		this.PRIVATE_announcePending = true;

		queueMicrotask(() => {
			this.PRIVATE_announcePending = false;
			this.state.announceResultsMessage.key++;
			this.state.announceResultsMessage.text =
				this.PRIVATE_announceMessages.join(" ");
			this.PRIVATE_announceMessages = [];
		});
	}

	/**
	 * Bind input to search. Returns unbind function.
	 */
	bindInput = (input: HTMLInputElement) => {
		const unbind = () => {
			this.removeInput(input);
		};
		const prev = this.PRIVATE_getBoundInput(input);

		if (prev) {
			return unbind;
		}

		this.PRIVATE_started(() => {
			const currentTerms = this.PRIVATE_getfindkitParams().getTerms();

			if (currentTerms) {
				// Enable search results linking by copying the terms to the input
				// from url bar but skip if if the input is active so we wont mess
				// with the user too much
				if (
					input.value.trim() === "" ||
					input !== this.PRIVATE_getActiveElement()
				) {
					input.value = currentTerms;
				}
			} else if (input.value.trim()) {
				// Other way around. If user manages to write something to the input
				// before this is called, use that value to make a search. This is
				// mainly for lazy loading when the input can be interacted with
				// before this .addInput() call
				this.PRIVATE_handleInputChange(input.value);
			}

			const listeners = this.PRIVATE_resources.child();

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
					this.container,
					"focusin",
					() => {
						this.PRIVATE_checkIfCanAnnounceResults();
					},
					{ passive: true, capture: true },
				),
			);

			listeners.create(() =>
				listen(
					input,
					"blur",
					() => {
						this.PRIVATE_checkIfCanAnnounceResults();
						this.state.keyboardCursor = undefined;
					},
					{ passive: true },
				),
			);

			listeners.create(() =>
				listen(this.container, "submit", (e) => {
					e.preventDefault();
					this.PRIVATE_submitAction();
				}),
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

						const form = this.container.querySelector(
							"#" + this.getUniqId("form"),
						);
						if (!form?.contains(input)) {
							// Manually invoke the submit action if the input is not inside the form
							// and does not naturally trigger the submit action
							this.PRIVATE_submitAction();
						}

						if (e.shiftKey) {
							this.focusFirstHit();
						}

						if (this.state.keyboardCursor) {
							e.preventDefault();
							this.PRIVATE_selectKeyboardCursor();
							return;
						}

						this.PRIVATE_handleInputChange(e.target.value);
					}
				}),
			);

			this.PRIVATE_inputs.push(
				ref({ el: input, unbindEvents: listeners.dispose }),
			);

			this.events.emit("bind-input", { input });
		});

		return unbind;
	};

	focusFirstHit() {
		const hit = this.elementHost.querySelector(`.${cn("hit")} a`);
		if (hit instanceof HTMLElement) {
			hit.focus();
		}
	}

	removeInput = (rmInput: HTMLInputElement) => {
		const input = this.PRIVATE_getBoundInput(rmInput);
		if (!input) {
			return;
		}

		input.unbindEvents();

		const inputIndex = this.PRIVATE_inputs.findIndex((obj) => obj === input);
		if (inputIndex !== -1) {
			this.PRIVATE_inputs.splice(inputIndex, 1);
		}

		this.events.emit("unbind-input", { input: rmInput });
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

	open = (terms?: string, options?: { toggle?: boolean }) => {
		if (this.state.status !== "closed" && options?.toggle) {
			this.close();
			return;
		}

		this.PRIVATE_started(() => {
			const findkitParams = this.PRIVATE_getfindkitParams();
			const nextTerms = terms === undefined ? findkitParams.getTerms() : terms;
			this.updateAddressBar(findkitParams.setTerms(nextTerms ?? ""), {
				push: !findkitParams.isActive(),
			});
		});
	};

	activateGroup(groupId: string | number | { id: string | number }) {
		if (typeof groupId === "string") {
			this.PRIVATE_started(() => {
				const findkitParams = this.PRIVATE_getfindkitParams();
				this.updateAddressBar(findkitParams.setGroupId(groupId), {
					push: false,
				});
			});
		} else if (typeof groupId === "number") {
			const groups =
				this.state.nextGroupDefinitions ?? this.state.usedGroupDefinitions;
			const id = groups[groupId]?.id;
			assertNotNil(id, `[findkit] Unknown group index ${id}`);
			this.activateGroup(id);
		} else {
			this.activateGroup(groupId.id);
		}
	}

	clearGroup() {
		this.PRIVATE_started(() => {
			const findkitParams = this.PRIVATE_getfindkitParams();
			this.updateAddressBar(findkitParams.clearGroupId(), {
				push: false,
			});
		});
	}

	dispose = () => {
		this.events.emit("dispose", {});

		const deleteReservedKey = (key: string) => {
			const reserved = reservedKeys.keys().find((r) => r.key === key);
			if (reserved) {
				reservedKeys.delete(reserved);
			}
		};

		deleteReservedKey(this.instanceId);

		// Delete default values
		deleteReservedKey(this.instanceId + this.separator + "q");
		deleteReservedKey(this.instanceId + this.separator + "id");
		deleteReservedKey(this.instanceId + this.separator + "c" + this.separator);

		// Delete optional keys
		if (this.searchKey) {
			deleteReservedKey(this.searchKey);
		}

		if (this.groupKey) {
			deleteReservedKey(this.groupKey);
		}

		if (this.customRouterDataPrefix) {
			deleteReservedKey(this.customRouterDataPrefix);
		}

		this.close();
		this.PRIVATE_resources.dispose();

		for (const input of this.PRIVATE_inputs) {
			this.removeInput(input.el);
		}
		this.events.dispose();
	};

	close = () => {
		if (this.state.status !== "closed") {
			this.updateAddressBar(this.PRIVATE_getfindkitParams().clearAll(), {
				push: true,
			});
		}
	};
}

function deepEqual(x: any, y: any) {
	if (Object.is(x, y)) {
		return true;
	} else if (
		typeof x === "object" &&
		x !== null &&
		typeof y === "object" &&
		y !== null
	) {
		const xKeys = Object.keys(x);
		if (xKeys.length !== Object.keys(y).length) {
			return false;
		}

		for (const prop of xKeys) {
			if (y.hasOwnProperty(prop)) {
				if (!deepEqual(x[prop], y[prop])) {
					return false;
				}
			} else {
				return false;
			}
		}

		return true;
	}
	return false;
}

/**
 * Ensure that groups have default objects/arrays so it will be easy to update
 * them in updateGroups(fn) without having to check if they exist.
 *
 * Uses mutation!
 */
function ensureDefaults(
	groups: GroupDefinition[],
): GroupDefinitionWithDefaults[] {
	for (const [i, group] of Object.entries(groups)) {
		group.id = group.id || "group-" + (Number(i) + 1);

		const params = group.params ?? (group.params = {});

		for (const key of ["sort", "filter", "tagBoost"] as const) {
			if (!params[key]) {
				params[key] = {};
			}
		}

		if (!params.tagQuery) {
			params.tagQuery = [];
		}
	}

	return groups as any;
}
