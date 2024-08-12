// @ts-check

/**
 * The DOM API in Findkit Worker does not support the `instanceof` for DOM element.
 * This function manually checks it using prototype chain.
 *
 * @param {any} el
 * @returns {el is HTMLElement}
 */
function isHTMLElement(el) {
	while (el) {
		const name = el?.constructor?.name;
		if (name === "HTMLElement") {
			return true;
		}
		el = Object.getPrototypeOf(el);
	}

	return false;
}

/**
 * @param {Document} doc
 * @param {string} id
 */
function selectWordPressBlock(doc, id) {
	const el = doc.querySelector(`main .wp-block-group:has(#${id})`);
	if (!isHTMLElement(el)) {
		return;
	}

	const content = el?.innerText.trim();
	const title = el?.querySelector("h2")?.innerText.trim();

	if (title && content) {
		return {
			id,
			title,
			content,
		};
	}
}

export default {
	async html({ window }, { request }, next) {
		const url = new URL(request.url);
		if (url.pathname !== "/") {
			return next();
		}

		const pricing = selectWordPressBlock(window.document, "pricing");
		const features = selectWordPressBlock(window.document, "features");

		const res = await next();

		if (pricing) {
			res.fragments.push(pricing);
		}

		if (features) {
			res.fragments.push(features);
		}

		return res;
	},
};
