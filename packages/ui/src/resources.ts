/**
 * Reserve one or multiple resouces that can be disposed at once with
 * `.dispose()`.
 */
export class Resources {
	#cleaners = new Set<() => void>();
	#disposed = false;
	#onDispose?: () => void;

	constructor(onDispose?: () => void) {
		this.#onDispose = onDispose;
	}

	get disposed() {
		return this.#disposed;
	}

	get size() {
		return this.#cleaners.size;
	}

	/**
	 * Create a resource in the callback. Return a function that releases the
	 * resource.
	 */
	create = (createResource: () => () => void) => {
		// Resource was disposed before it was actually created. Just return a
		// dummy cleaner.
		if (this.#disposed) {
			return () => {};
		}

		const cleanup = createResource();

		this.#cleaners.add(cleanup);

		return () => {
			// Ensure cleaner is executed only once
			if (this.#cleaners.has(cleanup)) {
				this.#cleaners.delete(cleanup);
				cleanup();
			}
		};
	};

	child = (onDispose?: () => void) => {
		const resources = new Resources(() => {
			this.#cleaners.delete(resources.dispose);
			onDispose?.();
		});
		this.create(() => resources.dispose);
		return resources;
	};

	/**
	 * Dispose all resources
	 */
	dispose = () => {
		this.#disposed = true;
		const copy = Array.from(this.#cleaners);
		// Remove the cleaners before calling them to avoid duplicate calls when
		// cleaners are manually called from other cleaners
		this.#cleaners.clear();
		copy.forEach((fn) => fn());
		this.#onDispose?.();
	};
}

export function listen<EventName extends keyof HTMLElementEventMap>(
	target: any,
	eventName: EventName,
	listener: (e: HTMLElementEventMap[EventName]) => any,
	options?: AddEventListenerOptions,
) {
	target.addEventListener(eventName as any, listener, options);
	return () => {
		target.removeEventListener(eventName as any, listener);
	};
}
