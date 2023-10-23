import { FindkitUIGenerics, Status } from "./cdn-entries";
import type { CustomRouterData, SearchResultHit } from "./search-engine";

export interface Handler {
	(event: any): void;
}

export interface EventObject {
	instanceId: string;
}

/**
 * @public
 *
 * Simple event emitter
 */
export class Emitter<Events extends {}, Source> {
	private PRIVATE_handlers = new Map<keyof Events, Set<Handler>>();
	private PRIVATE_source: Source;

	constructor(source: Source) {
		this.PRIVATE_source = source;
	}

	/**
	 * Bind an event handler to the emitter
	 *
	 * @returns a function to unbind the handler
	 */
	on<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: Events[EventName] & { source: Source }) => void,
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
		handler: (event: Events[EventName] & { source: Source }) => void,
	) {
		const off = this.on(eventName, (e) => {
			off();
			handler(e);
		});
		return off;
	}

	/**
	 * Manually unbind an event handler given to .on() or .once()
	 */
	off<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: any) => void,
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
		const payload = { ...event, ui: this.PRIVATE_source };
		const set = this.PRIVATE_handlers.get(eventName);

		if (typeof document !== "undefined") {
			const event = new Event("findkit-ui-event");
			Object.assign(event, { payload });
			document.dispatchEvent(event);
		}

		if (set) {
			for (const handler of set) {
				handler(payload);
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
export interface FetchEvent {
	/**
	 * The search terms used for the request
	 */
	terms: string;

	/**
	 * Request id
	 */
	id: string;
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
export interface GroupsChangeEvent<T extends FindkitUIGenerics> {
	groups: NonNullable<T["groups"]>;
}

/**
 * @public
 */
export interface ParamsChangeEvent<T extends FindkitUIGenerics> {
	params: NonNullable<T["params"]>;
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

export interface CustomRouterDataEvent<T extends FindkitUIGenerics> {
	data: undefined extends T["customRouterData"]
		? CustomRouterData
		: T["customRouterData"];
}

/**
 * @public
 *
 * FindkitUI event definitions
 */
export interface FindkitUIEvents<T extends FindkitUIGenerics = {}> {
	/**
	 * Emitted when the internal UI status changes.
	 */
	status: StatusChangeEvent;

	/**
	 * Emitted when search results have not been updated for a while. Useful for
	 * analytics
	 */
	"debounced-search": DebouncedSearchEvent;

	"custom-router-data": CustomRouterDataEvent<T>;

	/**
	 * Search request starts
	 */
	fetch: FetchEvent;

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
	 * When the FinkitUI instance is created
	 */
	init: {};

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
	groups: GroupsChangeEvent<T>;

	/**
	 * Emitted when the search params change
	 */
	params: ParamsChangeEvent<T>;

	"hit-click": HitClickEvent;

	/**
	 * When the implementation was loaded and initialized
	 */
	loaded: LoadedEvent;

	/**
	 * Emitted when the UI language changes
	 */
	lang: LanguageChangeEvent;
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

// interface MyEvents {
// 	ding: {
// 		instanceId: string;
// 		dong: number;
// 	};
// }

// const emitter = new Emitter<MyEvents>("sdf");

// emitter.on("ding", (e) => {
// 	const n: number = e.dong;

// 	// @ts-expect-error
// 	e.bad;
// });

// // @ts-expect-error
// emitter.on("bad", () => {});
