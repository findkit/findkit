/**
 * Reserve one or multiple resouces that can be disposed at once with
 * `.dispose()`.
 */
export class Resources {
	PRIVATE_cleaners = new Set<() => void>();
	PRIVATE_disposed = false;
	PRIVATE_onDispose?: () => void;

	constructor(onDispose?: () => void) {
		this.PRIVATE_onDispose = onDispose;
	}

	get disposed() {
		return this.PRIVATE_disposed;
	}

	get size() {
		return this.PRIVATE_cleaners.size;
	}

	/**
	 * Create a resource in the callback. Return a function that releases the
	 * resource.
	 */
	create = (createResource: () => () => void) => {
		// Resource was disposed bef?.dispose()ore it was actually created. Just return a
		// dummy cleaner.
		if (this.PRIVATE_disposed) {
			return () => {};
		}

		const cleanup = createResource();

		this.PRIVATE_cleaners.add(cleanup);

		return () => {
			// Ensure cleaner is executed only once
			if (this.PRIVATE_cleaners.has(cleanup)) {
				this.PRIVATE_cleaners.delete(cleanup);
				cleanup();
			}
		};
	};

	child = (onDispose?: () => void) => {
		const child = new Resources(() => {
			this.PRIVATE_cleaners.delete(child.dispose);
			onDispose?.();
		});

		if (this.disposed) {
			child.dispose();
		} else {
			this.create(() => child.dispose);
		}

		return child;
	};

	/**
	 * Dispose all resources
	 */
	dispose = () => {
		this.PRIVATE_disposed = true;
		const copy = Array.from(this.PRIVATE_cleaners);
		// Remove the cleaners before calling them to avoid duplicate calls when
		// cleaners are manually called from other cleaners
		this.PRIVATE_cleaners.clear();
		copy.forEach((fn) => fn());
		this.PRIVATE_onDispose?.();
	};
}

export function listen<EventName extends keyof HTMLElementEventMap>(
	target: any,
	eventName: EventName,
	listener: (e: HTMLElementEventMap[EventName]) => any,
	options?: AddEventListenerOptions | false,
) {
	target.addEventListener(eventName as any, listener, options);
	return () => {
		target.removeEventListener(eventName as any, listener);
	};
}
