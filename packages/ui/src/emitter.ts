import type { SearchResultHit, State } from "./search-engine";

export interface EventsConstraint {
	// [key: string | number | symbol]: EventObject;
}

export interface Handler {
	(event: any): void;
}

export interface EventObject {
	instanceId: string;
}

export class Emitter<Events extends EventsConstraint> {
	#handlers = new Map<keyof Events, Set<Handler>>();
	#instanceId: string;

	constructor(instanceId: string) {
		this.#instanceId = instanceId;
	}

	on<EventName extends keyof Events>(
		eventName: EventName,
		handler: (event: Events[EventName]) => void
	) {
		type wat = Events[EventName];
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
}

type Ding = Emitter<FindkitUIEvents>;

interface MyEvents {
	ding: {
		instanceId: string;
		dong: number;
	};
}

const emitter = new Emitter<MyEvents>("sdf");

emitter.on("ding", (e) => {
	const n: number = e.dong;

	// @ts-expect-error
	e.bad;
});

// @ts-expect-error
emitter.on("bad", () => {});
