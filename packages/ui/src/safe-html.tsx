import React, { ReactNode } from "react";

const ALLOWED_TAGS = /^(A|B|BR|CODE|DIV|EM|I|LI|OL|P|SMALL|SPAN|STRONG|U|UL)$/;

/**
 * A style declaration with a plain value: no functions, urls, quotes or
 * escapes
 */
const ALLOWED_STYLE =
	/^\s*(background-color|border|color|display|font-weight|margin|padding)\s*:[#\w\s.,%-]+$/i;

/**
 * Returns true only for urls that resolve to http or https. Relative urls
 * are accepted only when a base is given.
 */
export function isWebUrl(url: unknown, base?: string): url is string {
	try {
		return /^https?:$/.test(new URL(url as string, base).protocol);
	} catch {
		return false;
	}
}

function toVdom(node: ChildNode, key: number): ReactNode {
	if (node.nodeType === 3) {
		return node.textContent;
	}

	if (!(node instanceof HTMLElement) || !ALLOWED_TAGS.test(node.tagName)) {
		return null;
	}

	const props: Record<string, string | number> = { key };

	const style = (node.getAttribute("style") ?? "")
		.split(";")
		.filter((declaration) => ALLOWED_STYLE.test(declaration))
		.join(";");
	if (style) {
		props.style = style;
	}

	const href = node.getAttribute("href");
	if (node.tagName === "A" && href !== null && isWebUrl(href, location.href)) {
		props.href = href;
	}

	if (node.getAttribute("target") === "_blank") {
		props.target = "_blank";
		props.rel = "noopener";
	}

	return React.createElement(
		node.tagName.toLowerCase(),
		props,
		...Array.from(node.childNodes).map(toVdom),
	);
}

/**
 * Convert a html string to elements using only a small set of formatting
 * tags and attributes. Everything else is left out.
 */
export function htmlToElements(html: string): ReactNode[] {
	return Array.from(
		new DOMParser().parseFromString(html, "text/html").body.childNodes,
	).map(toVdom);
}
