import { devtools } from "valtio/utils";
import { cleanUndefined, isDeepEqual } from "./utils";
import { CustomFields } from "@findkit/fetch";
import { findkitFetch } from "@findkit/fetch";

import {
	FindkitFetchOptions,
	FindkitSearchGroupParams,
	FindkitSearchParams,
	FindkitSearchResponse,
} from "@findkit/fetch";
import { proxy, ref } from "valtio";
import {
	AddressBar,
	createAddressBar,
	FindkitURLSearchParams,
} from "./address-bar";

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
 */
export interface GroupFilters {
	/**
	 * Queries search results that match the tag query
	 * [[tagA, tagB]] tagA OR tagB
	 * [[tagA], [tagB]] tagA AND tagB
	 */
	tagQuery: string[][];
	/**
	 * 0-1 numerical value for demoting old pages
	 */
	createdDecay?: number;
	/**
	 * 0-1 numerical value for demoting stagnant pages
	 */
	modifiedDecay?: number;
	/**
	 * String type time expression
	 * Used with createdDecay or modifiedDecay
	 * Defines in which timeframe decay filter is applied, e.g. "7d"
	 */
	decayScale?: string;
	/**
	 * Defines highlight length
	 * Use 0 for blocking highlight query (performance boost)
	 */
	highlightLength?: number;
}

/**
 * Group type for the search engine
 *
 * @public
 */
export interface GroupDefinition {
	id: string;
	title: string;
	scoreBoost: number;
	filters: GroupFilters;
	previewSize: number;
}

/**
 * @public
 */
export interface State {
	groupDefinitions: GroupDefinition[];

	/**
	 * urlbar query string
	 */
	searchParams: string;

	terms: string;

	status: "closed" | "waiting" | "fetching" | "ready";

	currentGroupId: string | undefined;

	lang: string | undefined;

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

export interface EngineSearchGroupParams extends FindkitSearchGroupParams {
	id: string;
}
export interface EngineFullSearchParams
	extends Omit<FindkitSearchParams, "groups"> {
	groups: EngineSearchGroupParams[];
	publicToken?: string;
	searchEndpoint?: string;
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

const instanceIds = new Set<string>();

/**
 * @public
 */
export class SearchEngine {
	#requestId = 0;
	#pendingRequestIds: Map<number, AbortController> = new Map();
	#inputs = [] as {
		input: HTMLInputElement;
		onChange: (e: { target: unknown }) => void;
		onEnter: (e: KeyboardEvent) => void;
	}[];

	readonly addressBar: AddressBar;
	#fetcher: FindkitFetcher;
	readonly instanceId: string;
	readonly state: State;
	readonly publicToken: string;
	#searchEndpoint: string | undefined;
	#throttleTime: number;
	#searchMoreSize: number;
	#minSearchTermsLength: number;
	#unbindAddressBarListeners: () => void;
	#pendingTerms = "";
	#throttleTimerID?: ReturnType<typeof setTimeout>;

	constructor(options: {
		instanceId?: string;
		publicToken: string;
		searchEndpoint?: string;
		throttleTime?: number;
		searchMoreSize?: number;
		minSearchTermsLength?: number;
	}) {
		this.addressBar = createAddressBar();
		this.instanceId = options.instanceId ?? "fdk";
		this.publicToken = options.publicToken;

		if (instanceIds.has(this.instanceId)) {
			throw new Error(
				`[findkit] Instance id "${this.instanceId}" already exists. Pass in custom "instanceId" to avoid conflicts.`
			);
		}

		instanceIds.add(this.instanceId);

		const initialSearchParams = new FindkitURLSearchParams(
			this.instanceId,
			this.addressBar.getSearchParamsString()
		);

		this.state = proxy<State>({
			terms: initialSearchParams.getTerms(),
			currentGroupId: initialSearchParams.getGroupId(),
			searchParams: this.addressBar.getSearchParamsString(),
			lang: undefined,
			status: "closed",
			error: undefined,
			resultGroups: {},
			groupDefinitions: ref([]),
		});
		devtools(this.state);

		this.publicToken = options.publicToken;
		this.#searchEndpoint = options.searchEndpoint;

		this.#fetcher = findkitFetch;
		this.#throttleTime = options.throttleTime ?? 200;
		this.#searchMoreSize = options.searchMoreSize ?? 20;
		this.#minSearchTermsLength = options.minSearchTermsLength ?? 2;

		this.#syncInputs(initialSearchParams.getTerms());

		this.#unbindAddressBarListeners = this.addressBar.listen(
			this.#handleAddressChange
		);
		this.#handleAddressChange();
	}

	get findkitParams() {
		return new FindkitURLSearchParams(this.instanceId, this.state.searchParams);
	}

	#handleAddressChange = () => {
		this.state.searchParams = this.addressBar.getSearchParamsString();
		const nextParams = this.findkitParams;
		if (!this.findkitParams.isActive()) {
			this.#statusTransition("closed");
			this.state.terms = "";
			this.#pendingTerms = "";
			this.state.currentGroupId = undefined;
			return;
		}

		this.#statusTransition("waiting");

		const terms = nextParams.getTerms();
		const reset = terms !== this.state.terms;

		this.state.terms = terms;
		this.state.currentGroupId = nextParams.getGroupId();

		void this.#fetch({ reset });
	};

	#clearTimeout = () => {
		if (this.#throttleTimerID) {
			clearTimeout(this.#throttleTimerID);
			this.#throttleTimerID = undefined;
		}
	};

	updateAddressBar = (
		params: FindkitURLSearchParams,
		options?: { push?: boolean }
	) => {
		this.addressBar.update(params.toURLSearchParams(), options);
	};

	#handleInputChange(terms: string, options?: { force?: boolean }) {
		if (this.#pendingTerms === terms.trim()) {
			return;
		}

		this.#pendingTerms = terms.trim();

		if (options?.force === true) {
			this.setTerms(this.#pendingTerms);
			return;
		}

		if (this.#throttleTimerID) {
			return;
		}

		this.#throttleTimerID = setTimeout(() => {
			this.setTerms(this.#pendingTerms);
		}, this.#throttleTime);
	}

	setTerms(terms: string) {
		this.#clearTimeout();
		this.updateAddressBar(this.findkitParams.setTerms(terms));
	}

	setGroups = (groups: GroupDefinition[]) => {
		const isEqual = isDeepEqual(groups, this.state.groupDefinitions);
		if (isEqual) {
			return;
		}

		this.state.groupDefinitions = ref(groups);

		this.#clearTimeout();
		void this.#fetch({ reset: true });
	};

	searchMore() {
		void this.#fetch({ reset: false });
	}

	retry() {
		this.state.error = undefined;
		void this.#fetch({ reset: true });
	}

	/**
	 * Aka the "from" value for append requests
	 */
	#getGroupTotal(groupId: string): number {
		return this.state.resultGroups[groupId]?.hits.length ?? 0;
	}

	#getFullParams(options: {
		groups: GroupDefinition[];
		lang: string | undefined;
		terms: string;
		reset: boolean | undefined;
		appendGroupId: string | undefined;
	}): EngineFullSearchParams {
		const groups: EngineSearchGroupParams[] = options.groups
			.filter((group) => {
				if (!options.appendGroupId) {
					return true;
				}

				return group.id === options.appendGroupId;
			})
			.map((group) => {
				let size = group.previewSize;
				if (options.appendGroupId) {
					size = this.#searchMoreSize;
				}

				let from = 0;
				if (options.appendGroupId && !options.reset) {
					from = this.#getGroupTotal(options.appendGroupId);
				}

				return cleanUndefined({
					id: group.id,
					tagQuery: group.filters.tagQuery,
					createdDecay: group.filters.createdDecay,
					modifiedDecay: group.filters.modifiedDecay,
					decayScale: group.filters.decayScale,
					highlightLength: group.filters.highlightLength,
					lang: options.lang,
					size,
					from,
				});
			});

		const fullParams: EngineFullSearchParams = {
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
			// Initial waint state can only appear when the modal opens and no
			// searches are made yet
			if (current === "closed") {
				this.state.status = next;
			}
		} else {
			const _: never = next;
		}
	}

	#fetch = async (options: { reset: boolean }) => {
		this.#requestId += 1;
		const requestId = this.#requestId;

		if (this.state.status === "closed") {
			return;
		}

		const noGroups = this.state.groupDefinitions.length === 0;
		const tooFewTems = this.state.terms.length < this.#minSearchTermsLength;

		if (tooFewTems || noGroups) {
			this.state.resultGroups = {};
			this.#statusTransition("ready");
			return;
		}

		const appendGroupId = this.getCurrentGroupId();

		const fullParams = this.#getFullParams({
			groups: this.state.groupDefinitions,
			terms: this.state.terms,
			appendGroupId,
			lang: this.state.lang,
			reset: options.reset,
		});

		this.#statusTransition("fetching");

		const abortController = new AbortController();
		this.#pendingRequestIds.set(requestId, abortController);

		// await new Promise((resolve) => setTimeout(resolve, Math.random() * 4000));

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
			}
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

		fullParams.groups.forEach((group, index) => {
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

			resWithIds[group.id] = {
				hits,
				total: res.total,
				duration: res.duration,
			};
		});

		if (appendGroupId && !options?.reset) {
			this.#addAllResults(resWithIds);
		} else {
			this.state.resultGroups = resWithIds;
		}

		this.state.error = undefined;

		if (this.#pendingRequestIds.size === 0) {
			this.#statusTransition("ready");
		}

		this.#syncInputs(fullParams.q);
	};

	/**
	 * Get group id from the address bar if it is an existing group
	 */
	getCurrentGroupId(): string | undefined {
		const groups = this.state.groupDefinitions;

		// When using only one group we can just use the id of the first group
		if (groups.length === 1 && groups[0]) {
			return groups[0].id;
		}

		const id = this.findkitParams.getGroupId();
		return groups.find((group) => group.id === id)?.id;
	}

	#syncInputs = (terms: string) => {
		for (const input of this.#inputs) {
			// only change input value if it does not have focus
			const activeElement = document.activeElement?.shadowRoot?.activeElement;
			// this.shadowRoot?.activeElement ?? document.activeElement;
			if (input && input.input !== activeElement) {
				input.input.value = terms;
			}
		}
	};

	/**
	 * Bind input to search. Returns true when is new input is added. False if
	 * the given input was already added
	 */
	addInput = (input: HTMLInputElement) => {
		const prev = this.#inputs.find((o) => o.input === input);
		if (prev) {
			return false;
		}

		const currentTerms = this.state.terms;

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

		const onChange = (e: { target: unknown }): any => {
			assertInputEvent(e);
			this.#handleInputChange(e.target.value);
		};

		const onEnter = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				assertInputEvent(e);
				this.#handleInputChange(e.target.value, { force: true });
			}
		};

		input.addEventListener("input", onChange, { passive: true });
		input.addEventListener("keydown", onEnter, { passive: true });

		this.#inputs.push({ input, onChange, onEnter });

		return true;
	};

	removeInput = (rmInput: HTMLInputElement) => {
		const input = this.#inputs.find((input) => input?.input === rmInput);

		input?.input.removeEventListener("keydown", input.onEnter);

		input?.input.removeEventListener("change", input.onChange);

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

			let existing = this.state.resultGroups[key];
			if (!existing) {
				existing = {
					hits: [],
					total: more?.total ?? 0,
				};
			}

			existing.hits.push(...(more?.hits ?? []));
		}
	}

	open = (terms?: string) => {
		if (!this.findkitParams.isActive()) {
			this.updateAddressBar(this.findkitParams.setTerms(terms ?? ""), {
				push: true,
			});
		}
	};

	dispose = () => {
		instanceIds.delete(this.instanceId);
		this.close();
		this.#unbindAddressBarListeners();
	};

	close = () => {
		if (this.state.status !== "closed") {
			this.updateAddressBar(this.findkitParams.clearAll(), {
				push: true,
			});
		}
	};
}
