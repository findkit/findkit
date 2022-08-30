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

export function getScrollContainer(node: HTMLElement): HTMLElement | null {
	if (!node) {
		return null;
	}

	if (node.scrollHeight > node.clientHeight) {
		if (node === document.body) {
			// This is weird edge case. The <body> seems to be the scrollable
			// element but we need to get the measurements from the <html>
			// element aka documentElement.
			return document.documentElement;
		}
		return node;
	}

	if (!node.parentElement) {
		// Check for shadow dom
		const root = node.getRootNode();
		if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
			return getScrollContainer(root.host);
		}

		// Nothing to scroll
		return null;
	}

	return getScrollContainer(node.parentElement);
}

export function scrollToTop(el: HTMLElement) {
	const container = getScrollContainer(el);
	if (container && container !== document.documentElement) {
		container.scrollTo({
			top: 0,
		});
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
