import {
	FindkitUI,
	FindkitUIGenerics,
	FindkitUIOptions,
	Implementation,
	PreactFunctions,
	Status,
} from "./cdn-entries";
import type {
	CustomRouterData,
	GroupsOrDefault,
	SearchParamsOrDefault,
	SearchResultHit,
	UpdateGroupsArgument,
	UpdateParamsArgument,
} from "./search-engine";

export interface Handler {
	(event: any, context: any): void;
}

export interface EventObject {
	instanceId: string;
}

/**
 * @public
 *
 * Simple event emitter
 */
export class Emitter<Events extends {}, Context> {
	private PRIVATE_handlers = new Map<keyof Events, Set<Handler>>();
	private PRIVATE_context: Context;

	constructor(context: Context) {
		this.PRIVATE_context = context;
	}

	/**
	 * Bind an event handler to the emitter
	 *
	 * @returns a function to unbind the handler
	 */
	on<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: Events[EventName], context: Context) => void,
	) {
		const set = this.PRIVATE_handlers.get(eventName) || new Set();
		this.PRIVATE_handlers.set(eventName, set);
		set.add(handler);
		return () => {
			this.off(eventName, handler);
		};
	}

	/**
	 * Like .on() but will only fire once
	 *
	 * @returns a function to unbind the handler
	 */
	once<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: Events[EventName], context: Context) => void,
	) {
		const off = this.on(eventName, (e) => {
			off();
			handler(e, this.PRIVATE_context);
		});
		return off;
	}

	/**
	 * Manually unbind an event handler given to .on() or .once()
	 */
	off<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: any, context: Context) => void,
	) {
		const set = this.PRIVATE_handlers.get(eventName);
		set?.delete(handler);
	}

	/**
	 * Dispose the event emitter by removing all handlers.
	 *
	 * Do not call this from `ui.events`! It will break the UI!
	 */
	dispose() {
		this.PRIVATE_handlers.clear();
	}

	/**
	 * Emit event to the event handlers
	 */
	emit<EventName extends keyof Events>(
		eventName: EventName,
		event: Events[EventName],
	) {
		const set = this.PRIVATE_handlers.get(eventName);

		if (typeof window !== "undefined") {
			const browserEvent = new CustomEvent("findkituievent", {
				detail: {
					eventName: eventName,
					data: event,
					instance: this.PRIVATE_context,
				},
			});
			window.dispatchEvent(browserEvent);
		}

		if (set) {
			for (const handler of set) {
				handler(event, this.PRIVATE_context);
			}
		}
	}
}

/**
 * @public
 */
export interface StatusChangeEvent {
	next: Status;
	previous: Status;
}

/**
 * @public
 */
export interface DebouncedSearchEvent {
	/**
	 * The search terms used for the search
	 */
	terms: string;
}

/**
 * @public
 */
export interface FetchEvent<
	G extends FindkitUIGenerics = FindkitUIGenerics,
	O extends FindkitUIOptions<G> = FindkitUIOptions<G>,
> {
	/**
	 * The search terms used for the request
	 */
	terms: string;

	/**
	 * Request id
	 */
	id: string;

	/**
	 * Make transient update to the search params which is only used for next request
	 *
	 * Added in 0.13.0
	 */
	transientUpdateParams: (
		arg: UpdateParamsArgument<SearchParamsOrDefault<G, O>>,
	) => void;

	/**
	 * Make transient update to the groups which is only used for next request
	 *
	 * Added in 0.13.0
	 */
	transientUpdateGroups: (
		arg: UpdateGroupsArgument<GroupsOrDefault<G, O>>,
	) => void;
}

/**
 * @public
 */
export interface FetchDoneEvent {
	/**
	 * The search terms used for the request
	 */
	terms: string;

	/**
	 * Request id
	 */
	id: string;

	/**
	 * Whether this request was stale eg. a new request was made before this one finished
	 */
	stale: boolean;

	/**
	 * Total number of search results
	 */
	total: number;

	/**
	 * User is appending additional results to an group which already has
	 * results. Eg. user is paginating for more results. This is false when the
	 * user is searching for something new with news terms or filters.
	 */
	append: boolean;
}

/**
 * @public
 */
export interface OpenEvent {
	/**
	 * The container element
	 */
	container: Element;
}

/**
 * @public
 */
export interface RequestOpenEvent {
	/**
	 * True when the implementation has be already loaded. Use the "open"
	 * event to detect when implementation was loaded.
	 */
	preloaded: boolean;
}

/**
 * @public
 */
export interface GroupsChangeEvent<
	G extends FindkitUIGenerics = FindkitUIGenerics,
	O extends FindkitUIOptions<G> = FindkitUIOptions<G>,
> {
	groups: GroupsOrDefault<G, O>;
}

/**
 * @public
 */
export interface ParamsChangeEvent<
	G extends FindkitUIGenerics = FindkitUIGenerics,
	O extends FindkitUIOptions<G> = FindkitUIOptions<G>,
> {
	params: SearchParamsOrDefault<G, O>;
}

/**
 * @public
 */
export interface HitClickEvent {
	hit: SearchResultHit;
	preventDefault: () => void;
	target: HTMLElement;
	terms: string;
}

/**
 * @public
 */
export interface LanguageChangeEvent {
	lang: string;
}

/**
 * @public
 */
export interface LoadedEvent {
	/**
	 * The container element
	 */
	container: Element;
}

/**
 * @public
 */
export interface BindInputEvent {
	input: HTMLInputElement;
}

/**
 * @public
 */
export interface UnbindInputEvent {
	input: HTMLInputElement;
}

/**
 * @public
 */
export interface CustomRouterDataEvent<T extends FindkitUIGenerics> {
	data: undefined extends T["customRouterData"]
		? CustomRouterData
		: T["customRouterData"];
}

/**
 * @public
 */
export interface LoadingEvent {}

/**
 * @public
 */
export interface LoadingDoneEvent {}

/**
 * @public
 *
 * FindkitUI event definitions
 */
export interface FindkitUIEvents<
	G extends FindkitUIGenerics = FindkitUIGenerics,
	O extends FindkitUIOptions<G> = FindkitUIOptions<G>,
> {
	/**
	 * Emitted when the internal UI status changes.
	 */
	status: StatusChangeEvent;

	/**
	 * Emitted when search results have not been updated for a while. Useful for
	 * analytics
	 */
	"debounced-search": DebouncedSearchEvent;

	"custom-router-data": CustomRouterDataEvent<G>;

	/**
	 * Search request starts
	 */
	fetch: FetchEvent<G, O>;

	/**
	 * When a search request finishes
	 */
	"fetch-done": FetchDoneEvent;

	/**
	 * When an input is bound to the UI with .bindInput()
	 */
	"bind-input": BindInputEvent;

	/**
	 * When an input is unbound from the UI with the returned unbound from
	 * .bindInput() or the FindkitUI instance is disposed with .dispose()
	 */
	"unbind-input": UnbindInputEvent;

	/**
	 * When the FinkitUI is initialized with the options. The options property
	 * can be mutated.
	 */
	init: {
		readonly instanceId: string;

		/**
		 * Mutable options passed to FindkitUI constructor
		 */
		options: FindkitUIOptions<FindkitUIGenerics>;

		/**
		 * https://docs.findkit.com/ui/slot-overrides/hooks#preact
		 */
		preact: PreactFunctions;

		/**
		 * Utils and hooks
		 *
		 * https://docs.findkit.com/ui/api/utils/
		 * https://docs.findkit.com/ui/slot-overrides/hooks
		 */
		utils: {
			h: (...args: any[]) => any;
			html: (strings: TemplateStringsArray, ...values: any[]) => any;
			css: (strings: TemplateStringsArray, ...expr: string[]) => string;
			useParams: Implementation["useParams"];
			useGroups: Implementation["useGroups"];
			useTerms: Implementation["useTerms"];
			useResults: Implementation["useResults"];
			useTotal: Implementation["useTotal"];
			useLang: Implementation["useLang"];
			useInput: Implementation["useInput"];
			useTotalHitCount: Implementation["useTotalHitCount"];
			useLoading: Implementation["useLoading"];
			useCustomRouterData: Implementation["useCustomRouterData"];
		};
		// Explicitly listing everything here to get cleaner generated docs
	};

	/**
	 * When the UI discarded with .dispose()
	 */
	dispose: {};

	/**
	 * When the modal is opened
	 */
	open: OpenEvent;

	/**
	 * When modal opening is requested. The implementation loading can happen
	 * before the modal is actually opened. This can be used to show a loading
	 * indicator.
	 */
	"request-open": RequestOpenEvent;

	/**
	 * When the modal is closed
	 */
	close: {};

	/**
	 * Emitted when groups change
	 */
	groups: GroupsChangeEvent<G>;

	/**
	 * Emitted when the search params change
	 */
	params: ParamsChangeEvent<G>;

	"hit-click": HitClickEvent;

	/**
	 * When the implementation was loaded and initialized
	 */
	loaded: LoadedEvent;

	/**
	 * Emitted when the UI language changes
	 */
	lang: LanguageChangeEvent;

	/**
	 * Emitted when the UI starts loading something. Implementation code or a
	 * search request.
	 */
	loading: LoadingEvent;

	/**
	 * Emitted when the UI finishes loading something. Always called after the `loading` event.
	 */
	"loading-done": LoadingDoneEvent;
}

/**
 * Promise like value container but synchronous and without error handling-
 *
 * Usage
 *
 *    const value = lazyValue<string>();
 *
 *    value((val) => {
 *     console.log(val);
 *    });
 *
 *    value.provide("hello");
 *
 * The callback will be called only once when the value is provided.
 * If the value was already provided, the callback will be called immediately.
 */
export function lazyValue<T>() {
	let value: T | undefined;

	const valueEmitter = new Emitter<{ value: { value: T } }, {}>("lazyValue");

	const valueAccessor = (giveValue: (value: T) => void | undefined) => {
		if (value !== undefined) {
			giveValue(value);
		} else {
			valueEmitter.once("value", (e) => {
				value = e.value;
				giveValue(value);
			});
		}
	};

	return Object.assign(valueAccessor, {
		get() {
			return value;
		},
		provide: (val: T) => {
			if (value === undefined) {
				value = val;
				valueEmitter.emit("value", { value: val });
			} else {
				throw new Error("Value already provided");
			}
		},
	});
}

/**
 * @public
 *
 * Union of all FindkitUI events tranformed to:
 *
 *  { eventName: "fetch", data: FetchEvent } | { eventName: "fetch-done", data: FetchDoneEvent } | ...
 *
 */
type FindkitUIEventsUnion = {
	[K in keyof FindkitUIEvents]: FindkitUIEvents[K] extends infer U
		? { eventName: K; data: U; instance: FindkitUI<any, any> }
		: never;
}[keyof FindkitUIEvents];

declare global {
	interface WindowEventMap {
		findkituievent: CustomEvent<FindkitUIEventsUnion>;
	}
}
