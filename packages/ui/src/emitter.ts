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
		handler: (event: Events[EventName]) => void
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
		handler: (event: any) => void
	) {
		const set = this.#handlers.get(eventName);
		set?.delete(handler);
	}

	dispose() {
		this.#handlers.clear();
	}

	emit<EventName extends keyof Events>(
		eventName: EventName,
		event: Omit<Events[EventName], "instanceId">
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
	"debounced-search": {
		instanceId: string;
		terms: string;
	};
	fetch: {
		instanceId: string;
		terms: string;
	};
	dispose: {
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
