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

function hasScrollBar(node: HTMLElement) {
	if (node.scrollHeight === node.clientHeight) {
		return false;
	}

	const style = getComputedStyle(node);
	return ["overflow", "overflow-y"].some((prop) => {
		return /auto|scroll/i.test(style.getPropertyValue(prop));
	});
}

export function getScrollContainer(node: HTMLElement): HTMLElement | null {
	if (hasScrollBar(node)) {
		if (node === document.body) {
			// This is weird edge case. The <body> seems to be the scrollable
			// element but we need to get the measurements from the <html>
			// element aka documentElement.
			return document.documentElement;
		}
		return node;
	}

	if (!node.parentElement) {
		// Check for shadow dom break out of it if it is "open"
		const root = node.getRootNode();
		if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
			return getScrollContainer(root.host);
		}

		// Got to root
		return document.documentElement;
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
