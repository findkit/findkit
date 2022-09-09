/**
 * Listen on multiple events on events targets and remove them using one function
 * call
 */
export class MultiListener {
	#cleaners = new Set<() => void>();

	on<EventName extends keyof HTMLElementEventMap>(
		target: any,
		eventName: EventName,
		listener: (e: HTMLElementEventMap[EventName]) => any,
		options?: AddEventListenerOptions,
	) {
		target.addEventListener(eventName as any, listener, options);
		const off = () => {
			target.removeEventListener(eventName as any, listener);
			this.#cleaners.delete(off);
		};
		this.#cleaners.add(off);
		return off;
	}

	off = () => {
		for (const clean of this.#cleaners) {
			clean();
		}
		this.#cleaners.clear();
	};

	raw = (cb: () => any) => {
		this.#cleaners.add(cb);
	};
}
