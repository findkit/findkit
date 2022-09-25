import { SearchEngine } from "./cdn-entries";
import type {
	GroupDefinition,
	SearchEngineParams,
	SearchResultHit,
	State,
} from "./search-engine";

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
	#handlers = new Map<keyof Events, Set<Handler>>();
	#source: Source;

	constructor(source: Source) {
		this.#source = source;
	}

	on<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: Events[EventName] & { source: Source }) => void,
	) {
		const set = this.#handlers.get(eventName) || new Set();
		this.#handlers.set(eventName, set);
		set.add(handler);
		return () => {
			this.off(eventName, handler);
		};
	}

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

	off<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: any) => void,
	) {
		const set = this.#handlers.get(eventName);
		set?.delete(handler);
	}

	dispose() {
		this.#handlers.clear();
	}

	emit<EventName extends keyof Events>(
		eventName: EventName,
		event: Events[EventName],
	) {
		const payload = { ...event, ui: this.#source };
		const set = this.#handlers.get(eventName);

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
 *
 * FindkitUI event definitions
 */
export interface FindkitUIEvents {
	"status-change": {
		next: State["status"];
		previous: State["status"];
	};

	/**
	 * Emitted when search results have not been updated for a while. Useful for
	 * analytics
	 */
	"debounced-search": {
		terms: string;
	};

	/**
	 * Search reqeust starts
	 */
	fetch: {
		terms: string;
		/**
		 * Request id
		 */
		id: string;
	};

	/**
	 * When a search request finishes
	 */
	"fetch-done": {
		terms: string;
		/**
		 * Request id
		 */
		id: string;

		/**
		 * Whether this request was stale eg. a new request was made before this one finished
		 */
		stale: boolean;
	};

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
	open: {};

	/**
	 * When modal opening is requested. The implementation loading can happen
	 * before the modal is actually opened. This can be used to show a loading
	 * indicator.
	 */
	"request-open": {
		/**
		 * True when the implementation has be already loaded. Use the "open"
		 * event to detect when implementation was loaded.
		 */
		preloaded: boolean;
	};

	/**
	 * When the modal is closed
	 */
	close: {};

	"groups-change": {
		groups: GroupDefinition[];
	};
	"params-change": {
		params: SearchEngineParams;
	};
	"hit-click": {
		hit: SearchResultHit;
		preventDefault: () => void;
		target: HTMLElement;
		terms: string;
	};

	/**
	 * When the implementation was loaded
	 */
	loaded: {
		/**
		 * Private API. Do not use.
		 */
		__engine: SearchEngine;
	};
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
