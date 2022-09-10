/**
 * Reserve one or multiple resouces that can be disposed at once with
 * `.dispose()`.
 */
export class Resources {
	#cleaners = new Set<() => void>();
	#disposed = false;

	get disposed() {
		return this.#disposed;
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

	child = () => {
		const resources = new Resources();
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
