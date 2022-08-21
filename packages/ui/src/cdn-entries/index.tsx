import type {
	GroupDefinition,
	SearchEngine,
	State,
	SearchResultHit,
	GroupFilters,
	SetGroupsArgument,
} from "../search-engine";
import type { AddressBar, FindkitURLSearchParams } from "../address-bar";
import type { Slots } from "../core-hooks";
import type {
	ModalImplementation,
	Dispatch,
	SetStateAction,
} from "./implementation";
import type { initModal } from "../modal";
import type { CustomFields } from "@findkit/fetch";
import { Emitter, FindkitUIEvents } from "../emitter";

export {
	FindkitURLSearchParams,
	AddressBar,
	GroupFilters,
	GroupDefinition,
	Slots,
	ModalImplementation,
	State,
	initModal,
	Dispatch,
	SearchResultHit,
	SetStateAction,
	CustomFields,
	SearchEngine,
};

const doc = () => document;

/**
 * Variable created by the esbuild config in jakefile.js
 */
declare const FINDKIT_CDN_ROOT: string;
declare const FINDKIT_VERSION: string;
declare const FINDKIT_MODULE_FORMAT: "esm" | "cjs";

export const VERSION = FINDKIT_VERSION;

function cdnFile(path: string) {
	const root = FINDKIT_CDN_ROOT;
	if (path.endsWith(".js")) {
		return `${root}/esm/${path}`;
	} else {
		return `${root}/${path}`;
	}
}

let preconnected = false;
/**
 * Pre-connect to the search endpoint to make the first search faster
 */
function preconnect() {
	if (preconnected) {
		return;
	}

	preconnected = true;

	const dnsPreconnect = doc().createElement("link");
	dnsPreconnect.rel = "preconnect";
	dnsPreconnect.href = "https://search.findkit.com";
	doc().head?.appendChild(dnsPreconnect);
}

/**
 * No-op template tag for css. This only for editor syntax highlighting.
 *
 * @public
 */
export function css(strings: TemplateStringsArray, ...expr: string[]) {
	let str = "";
	strings.forEach((string, i) => {
		str += string + (expr[i] || "");
	});

	return str;
}

/**
 * Simple wrapper for the DOMContentLoaded event which fires the callback when
 * bound after the actual event
 */
function onDomContentLoaded(cb: () => any) {
	if (/complete|interactive|loaded/.test(doc().readyState)) {
		cb();
	} else {
		doc().addEventListener(
			"DOMContentLoaded",
			() => {
				cb();
			},
			{ once: true }
		);
	}
}

const lazyImplementation: Partial<ModalImplementation> = {};

function createShellFunction<Key extends keyof ModalImplementation>(name: Key) {
	return (...args: any[]) => {
		const fn = lazyImplementation[name] as any;
		if (!fn) {
			throw new Error(`[findkit] Implementation for "${name}" not loaded yet!`);
		}

		return fn(...args);
	};
}

/**
 * HTM (Hyperscript Tagged Markup) tagged template literal.
 * https://github.com/developit/htm
 *
 * @public
 */
export const html = createShellFunction("html");

/**
 * JSX pragma
 *
 * @public
 */
export const h = createShellFunction("h");

/**
 * React / Preact useState()
 *
 * @public
 */
export const useState = createShellFunction("useState");

async function preloadStylesheet(href: string) {
	const link = doc().createElement("link");
	link.rel = "preload";
	link.as = "style";
	link.href = href;
	const promise = new Promise<void>((resolve) => {
		link.addEventListener("load", () => {
			doc().head?.removeChild(link);
			resolve();
		});
	});
	doc().head?.appendChild(link);
	return promise;
}

async function loadScriptFromGlobal<T>(
	globalName: string,
	src: string
): Promise<T> {
	const script = doc().createElement("script");
	script.type = "module";

	const promise = new Promise<void>((resolve) => {
		script.addEventListener("load", () => {
			doc().head?.removeChild(script);
			resolve();
		});
	});

	script.src = src;
	doc().head?.appendChild(script);

	await promise;

	const output = (window as any)[globalName];
	if (!output) {
		throw new Error(
			`[findkit] Global "${globalName}" was not defined by ${src}`
		);
	}

	return output;
}

/**
 * Modal options
 *
 * @public
 */
export interface FindkitUIOptions {
	publicToken: string;
	instanceId?: string;
	groups?: GroupDefinition[];
	shadowDom?: boolean;
	css?: string;
	styleSheet?: string;
	slots?: Partial<Slots>;
	load?: () => Promise<ModalImplementation>;
	searchEndpoint?: string;
}

/**
 * The Lazy loading Findkit UI
 *
 * @public
 */
export class FindkitUI {
	#implementationPromise?: Promise<ModalImplementation>;
	#enginePromise?: Promise<SearchEngine>;
	#options: FindkitUIOptions;
	readonly events: Emitter<FindkitUIEvents>;

	constructor(options: FindkitUIOptions) {
		this.#options = options;
		this.events = new Emitter(this.#instanceId);
		if (this.#isAlreadyOpened()) {
			void this.open();
		}
	}

	get #instanceId() {
		return this.#options.instanceId ?? "fdk";
	}

	#isAlreadyOpened() {
		const params = new URLSearchParams(location.search);
		return params.has(this.#instanceId + "_q");
	}

	async #loadImplementation() {
		if (this.#implementationPromise) {
			return await this.#implementationPromise;
		}

		// const modulePromise = import(
		//     cdnFile("modal.js")
		// ) as Promise<ModalModule>;

		if (this.#options.load) {
			this.#implementationPromise = this.#options.load();
		} else {
			this.#implementationPromise = loadScriptFromGlobal<ModalImplementation>(
				"FINDKIT_" + FINDKIT_VERSION,
				cdnFile("implementation.js")
			);
		}

		void this.#implementationPromise.then((mod) => {
			Object.assign(lazyImplementation, mod);
		});

		const preloadStylesPromise = Promise.all(
			this.#getStyleSheets().map((href) => preloadStylesheet(href))
		);

		await preloadStylesPromise;

		return await this.#implementationPromise;
	}

	preload() {
		void this.#getEngine();
	}

	#getStyleSheets(): string[] {
		const sheets = [cdnFile("styles.css")];
		if (this.#options.styleSheet) {
			sheets.push(this.#options.styleSheet);
		}
		return sheets;
	}

	async open(terms?: string) {
		preconnect();
		const engine = await this.#getEngine();
		engine.open(terms);
		// return engine;
	}

	#pendingGroups?: SetGroupsArgument;

	async setGroups(groups: SetGroupsArgument) {
		this.#pendingGroups = groups;
		(await this.#enginePromise)?.setGroups(groups);
	}

	async #getEngine() {
		if (this.#enginePromise) {
			return this.#enginePromise;
		}

		this.#enginePromise = new Promise<SearchEngine>((resolve) => {
			void this.#loadImplementation().then((impl) => {
				const { styleSheet: _1, load: _2, ...rest } = this.#options;

				resolve(
					impl.initModal({
						...rest,
						styleSheets: this.#getStyleSheets(),
						instanceId: this.#instanceId,
						events: this.events,
						searchEndpoint: this.#options.searchEndpoint,
					})
				);
			});
		});

		const engine = await this.#enginePromise;
		if (this.#pendingGroups) {
			engine.setGroups(this.#pendingGroups);
		}

		return engine;
	}

	async close() {
		const engine = await this.#enginePromise;
		engine?.close();
	}

	async dispose() {
		if (this.#enginePromise) {
			(await this.#enginePromise).dispose();
		}
	}

	#handleButtonHover = () => {
		void this.preload();
	};

	#handleButtonClick = () => {
		void this.open();
	};

	#bindOpeners(elements: Element[] | NodeListOf<Element>) {
		for (const el of elements) {
			el.addEventListener("click", this.#handleButtonClick);
			el.addEventListener("mouseover", this.#handleButtonHover, {
				once: true,
			});
		}
	}

	openFrom(elements: string | NodeListOf<Element> | Element[]) {
		if (typeof elements === "string") {
			onDomContentLoaded(() => {
				this.#bindOpeners(doc().querySelectorAll(elements));
			});
		} else {
			this.#bindOpeners(elements);
		}
	}
}
