// @ts-check
/**
 * @typedef {Object} Fragment
 * @property {string} h1Title
 * @property {string} h2Title
 * @property {string} h3Title
 * @property {string} content
 * @property {string} id
 */

/**
 * Parse <h3> headings into an array of fragments.
 */
class Fragmenter {
	h1Title = "";
	h1Content = "";
	h2title = "";

	/** @type {"h1" | "h2" | "h3"} */
	level = "h1";

	/** @type {Fragment[]} */
	fragments = [];

	/** @type {Fragment} */
	currentFragment;

	/** @type {Element} */
	container;

	/** @type {Element|null} */
	currentElement = null;

	/**
	 * @type {((el: Element, fragment: Fragment) => string | null | undefined) | undefined}
	 */
	getCustomText;

	/**
	 * @param {Element} container - The document from which to extract content.
	 * @param {Object} [options]
	 * @param {(el: Element) => string | null | undefined} [options.getText] - A function that returns the text to be used for a fragment. Return "" to skip the element or undefined to use the default text extractor
	 */
	constructor(container, options) {
		this.container = container;
		this.getCustomText = options?.getText;
		this.$currentFragment = this.createFragment();
	}

	nextFragment() {
		// Add the current fragment to the list if it has all the required fields
		if (
			this.currentFragment &&
			this.currentFragment.id &&
			this.currentFragment.content &&
			this.currentFragment.h3Title
		) {
			this.fragments.push(this.currentFragment);
		}

		// and start new fragment creation
		this.currentFragment = this.createFragment();
	}

	getCurrentText() {
		if (!this.currentElement) {
			return "";
		}

		const custom = this.getCustomText?.(
			this.currentElement,
			this.currentFragment,
		);

		if (typeof custom === "string") {
			return custom;
		}

		let text = this.currentElement.textContent ?? "";
		if (["P", "DIV"].includes(this.currentElement.tagName)) {
			// ensure text in block elements are separated by space
			text += " ";
		}

		return text;
	}

	intoNextElement() {
		this.currentElement = this.currentElement?.nextElementSibling ?? null;
	}

	get tagName() {
		return this.currentElement?.tagName ?? "";
	}

	/**
	 * @returns {Fragment}
	 */
	createFragment() {
		return {
			id: this.currentElement?.id ?? "",
			h1Title: this.h1Title,
			h2Title: this.h2title,
			h3Title: this.getCurrentText(),
			content: "",
		};
	}

	parse() {
		this.currentElement = this.container.querySelector("h1");

		while (this.currentElement) {
			if (this.tagName === "H1") {
				this.level = "h1";
				this.h1Title = this.getCurrentText();
				this.intoNextElement();
				continue;
			} else if (this.tagName === "H2") {
				this.level = "h2";
				this.h2title = this.getCurrentText();
				this.intoNextElement();
				continue;
			} else if (this.tagName === "H3") {
				this.level = "h3";
				// <h3> starts a new fragment
				this.nextFragment();
				this.intoNextElement();
				continue;
			} else if (this.level === "h1") {
				this.h1Content += this.getCurrentText();
				this.intoNextElement();
			} else if (this.currentFragment && this.level === "h3") {
				this.currentFragment.content += this.getCurrentText();
				this.intoNextElement();
				continue;
			} else {
				this.intoNextElement();
				continue;
			}
		}

		// push the last fragment too
		this.nextFragment();

		return this.fragments;
	}
}

/**
 * @param {Element} container
 * @param {Object} [options]
 * @param {string} [options.h1Title]
 * @param {string} [options.h2Title]
 * @param {boolean} [options.h1Fragment]
 */
function createFragments(container, options) {
	const fragmenter = new Fragmenter(container, {
		getText: (el) => {
			if (el.classList.contains("theme-code-block")) {
				return "";
			}
		},
	});

	const fragments = fragmenter.parse().map((f) => {
		const cleanedTitle = f.h3Title
			// remove function call parens `.ding(removeMe)` -> `.ding``
			.replace(/\(.*?\)/g, "")
			// remove leading dot `.ding` -> `ding`
			.replace(/^\.+/, "")
			// remove type annotations from properties `prop: string` -> `prop`
			.replace(/:.+/, "")
			.trim();

		/** @type {import("@findkit/ui").CustomFields} */
		const customFields = {
			h1Title: {
				type: "keyword",
				value: options?.h1Title ?? f.h1Title,
			},
			h2Title: {
				type: "keyword",
				value: options?.h2Title ?? f.h2Title,
			},
			h3Title: {
				type: "keyword",
				value: f.h3Title,
			},
		};

		return {
			id: f.id,
			title: cleanedTitle,
			content: f.content,
			contentNoHighlight: f.h1Title + " " + f.h2Title,
			customFields,
			tags: [
				"api",
				"api/" +
					f.h2Title
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, " ")
						.trim()
						.replace(" ", "-"),
			],
		};
	});

	if (options?.h1Fragment) {
		fragments.unshift({
			id: "top",
			title: fragmenter.h1Title,
			content: fragmenter.h1Content,
			contentNoHighlight: "",
			tags: [],
			customFields: {},
		});
	}

	return fragments;
}

export default {
	async html({ window }, { request }, next) {
		const url = new URL(request.url);
		let fragments = [];

		if (url.pathname === "/ui/api/") {
			fragments = createFragments(window.document.querySelector(".markdown"), {
				h1Title: "FindkitUI API",
			});
		} else if (url.pathname === "/ui/api/groups/") {
			fragments = createFragments(window.document, {
				h1Title: "FindkitUI Group",
			});
		} else if (url.pathname === "/ui/api/events/") {
			fragments = createFragments(window.document, {
				h1Title: "FindkitUI",
			});
		} else if (url.pathname === "/ui/api/utils/") {
			fragments = createFragments(window.document, {
				h1Title: "FindkitUI Util",
			});
		} else if (url.pathname === "/ui/api/params/") {
			fragments = createFragments(window.document, {
				h1Title: "FindkitUI Search Param",
				h1Fragment: true,
			});
		} else if (url.pathname === "/toml/options/") {
			fragments = createFragments(window.document, {
				h1Title: "findkit.toml",
			});
		} else if (url.pathname === "/toml/tags/") {
			fragments = createFragments(window.document, {
				h1Title: "findkit.toml tags",
				h1Fragment: true,
			});
		} else if (url.pathname === "/crawler/meta-tag/") {
			fragments = createFragments(window.document, {});
		} else if (url.pathname === "/workers/events/") {
			fragments = createFragments(window.document, {
				h1Title: "FindkitUI Worker Event",
			});
		}

		const res = await next();

		res.fragments = fragments;

		return res;
	},
};
