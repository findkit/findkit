import { createClassNameScoper } from "./scoper";

/**
 * @param ob Remove undefied keys from object. Just makes things cleaner for
 * tests
 */
export function cleanUndefined<T extends {}>(ob: T): T {
	const out = {} as T;

	for (const key in ob) {
		if (ob[key] !== undefined) {
			out[key] = ob[key];
		}
	}

	return out;
}

/**
 * Asserts that given object is not null or undefined
 */
export function assertNonNullable<T>(
	ob: T,
	assertionMessage: string,
): asserts ob is NonNullable<T> {
	if (ob === null || ob === undefined) {
		throw new Error(assertionMessage);
	}
}

export const { scopeClassNames, scopeView } =
	createClassNameScoper<ClassNames>();

export const View = scopeView("findkit");
export const cn = scopeClassNames("findkit");

function hasScrollBar(node: Element) {
	if (node.scrollHeight === node.clientHeight) {
		return false;
	}

	const style = getComputedStyle(node);
	return ["overflow", "overflow-y"].some((prop) => {
		return /auto|scroll/i.test(style.getPropertyValue(prop));
	});
}

/**
 * Traverse to the closest scrollable element. Go through shadow doms.
 */
export function getScrollContainer(node: Element | ShadowRoot | null): Element {
	// At the top most root. The full page scrolls
	if (!node) {
		return document.documentElement;
	}

	if (node instanceof ShadowRoot) {
		return getScrollContainer(node.host);
	}

	if (hasScrollBar(node)) {
		if (node === document.body) {
			// This is weird edge case. The <body> seems to be the scrollable
			// element but we need to get the measurements from the <html>
			// element aka documentElement.
			return document.documentElement;
		}
		return node;
	}

	// On shadow root or document root
	if (!node.parentElement) {
		// Check for shadow root break out of it if it is "open"
		const root = node.getRootNode();
		if (root instanceof ShadowRoot) {
			return getScrollContainer(root.host);
		}
	}

	return getScrollContainer(node.parentElement);
}

export function scrollToTop(el: HTMLElement) {
	const container = getScrollContainer(el);
	if (container && container !== document.documentElement) {
		container.scrollTo({ top: 0 });
	}
}

export function scrollIntoViewIfNeeded(
	el: HTMLElement,
	offsetSelector?: string,
) {
	const scrollContainer = getScrollContainer(el);
	let headerOffset = 0;
	const margin = 30;

	if (!scrollContainer) {
		return;
	}

	if (offsetSelector) {
		const header = scrollContainer.querySelector(offsetSelector);
		if (header instanceof HTMLElement) {
			headerOffset = header.clientHeight;
		}
	}

	const rect = el.getBoundingClientRect();

	if (rect.top < headerOffset) {
		scrollContainer.scrollTo({
			top: scrollContainer.scrollTop + rect.top - headerOffset - margin,
			behavior: "smooth",
		});
	} else if (rect.bottom > scrollContainer.clientHeight) {
		scrollContainer.scrollTo({
			top:
				scrollContainer.scrollTop +
				rect.bottom -
				scrollContainer.clientHeight +
				margin,
			behavior: "smooth",
		});
	}
}

export function isProd() {
	if (typeof location !== "undefined") {
		if (
			/__force_findkit_dev__/.test(location.href) ||
			location.protocol === "http:" ||
			location.port ||
			location.hostname === "localhost" ||
			location.hostname.endsWith(".test")
		) {
			return false;
		}
	}

	try {
		if (process.env.NODE_ENV === "production") {
			return true;
		}
	} catch {
		// `process` might not defined or transpiled in some enviroments
	}

	return true;
}

export function deprecationNotice(message: string) {
	if (!isProd()) {
		console.warn(`[Findkit] DEPRECATED ${message}`);
	}
}

/**
 * Throws on empty strings and when string consists of just whitespace characters
 * Prefixes error messages with "[findkit] "
 * @param testString
 * @param errorMessage
 */
export function assertNonZeroString(
	testString: string | undefined,
	errorMessage: string,
) {
	if (typeof testString === "string" && testString.trim().length === 0) {
		throw new Error(`[findkit] ${errorMessage}`);
	}
}
