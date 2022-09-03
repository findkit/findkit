/**
 * Event that fires on popstate AND history.pushState() and
 * history.replaceState()
 *
 * Move to Navigation API once possible
 * https://caniuse.com/mdn-api_navigation_navigate_event
 */
export const NORMALIZED_HISTORY_EVENT = "findkit-history-change";

/**
 * Invoke the callback when the method of the target object is called
 */
function monitorMethod<Target extends {}, Method extends keyof Target>(
	targetObject: Target,
	method: Method,
	cb: () => void,
) {
	const anyTarget = targetObject as any;
	const orginalMethod = anyTarget[method] as any;
	let disposed = false;

	const proxy = new Proxy(anyTarget[method], {
		apply: (target: any, thisArg, argArray) => {
			const res = target.apply(thisArg, argArray);
			if (!disposed) {
				cb();
			}
			return res;
		},
	});

	anyTarget[method] = proxy;

	return () => {
		disposed = true;
		// can restore old back only when no one else has overwritten it since.
		// If so not much we can do.
		if (anyTarget[method] === proxy) {
			anyTarget[method] = orginalMethod;
		}
	};
}

function dispatchNormalizedHistoryEvent() {
	window.dispatchEvent(new CustomEvent(NORMALIZED_HISTORY_EVENT));
}

let historySpyInitialized = false;

export function initNormalizedHistoryEvent() {
	if (historySpyInitialized) {
		return;
	}

	monitorMethod(history, "pushState", dispatchNormalizedHistoryEvent);
	monitorMethod(history, "replaceState", dispatchNormalizedHistoryEvent);
	window.addEventListener("popstate", dispatchNormalizedHistoryEvent);
	window.addEventListener("hashchange", dispatchNormalizedHistoryEvent);
	historySpyInitialized = true;
}
