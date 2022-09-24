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
export class Emitter<Events extends {}> {
	#handlers = new Map<keyof Events, Set<Handler>>();
	#instanceId: string;

	constructor(instanceId: string) {
		this.#instanceId = instanceId;
	}

	on<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: Events[EventName]) => void,
	) {
		const set = this.#handlers.get(eventName) || new Set();
		this.#handlers.set(eventName, set);
		set.add(handler);
		return () => {
			this.off(eventName, handler);
		};
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
		event: Omit<Events[EventName], "instanceId">,
	) {
		const set = this.#handlers.get(eventName);
		if (set) {
			for (const handler of set) {
				handler({ ...event, instanceId: this.#instanceId });
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
		instanceId: string;
		next: State["status"];
		previous: State["status"];
	};

	/**
	 * Emitted when search results have not been updated for a while. Useful for
	 * analytics
	 */
	"debounced-search": {
		instanceId: string;
		terms: string;
	};

	/**
	 * Search reqeust starts
	 */
	fetch: {
		instanceId: string;
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
		instanceId: string;
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
	 * When the UI discarded with .dispose()
	 */
	dispose: {
		instanceId: string;
	};

	/**
	 * Whent he modal is opened
	 */
	open: {
		instanceId: string;
	};

	/**
	 * When the modal is closed
	 */
	close: {
		instanceId: string;
	};

	"groups-change": {
		instanceId: string;
		groups: GroupDefinition[];
	};
	"params-change": {
		instanceId: string;
		params: SearchEngineParams;
	};
	"hit-click": {
		instanceId: string;
		hit: SearchResultHit;
		preventDefault: () => void;
		target: HTMLElement;
		terms: string;
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
