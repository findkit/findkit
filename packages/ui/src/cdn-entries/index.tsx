import type {
	GroupDefinition,
	SearchEngine,
	State,
	SearchResultHit,
	UpdateGroupsArgument,
	UpdateParamsArgument,
	SearchEngineParams,
	SearchEngineOptions,
	FindkitURLSearchParams,
} from "../search-engine";
import type { RouterBackend } from "../router";
import type {
	Implementation,
	Dispatch,
	SetStateAction,
	SearchResultHitWithGroupId,
} from "./implementation";
import type { init } from "../modal";
import type { CustomFields } from "@findkit/fetch";
import { Emitter, FindkitUIEvents } from "../emitter";
import type { TranslationStrings } from "../translations";
import { listen, Resources } from "../resources";
import type {
	Slots,
	HeaderSlotProps,
	ContentSlotProps,
	LayoutSlotProps,
} from "../slots";

export {
	HeaderSlotProps,
	ContentSlotProps,
	LayoutSlotProps,
	SearchResultHitWithGroupId,
	TranslationStrings,
	Emitter,
	SearchEngineParams,
	FindkitUIEvents,
	FindkitURLSearchParams,
	RouterBackend,
	GroupDefinition,
	Slots,
	Implementation,
	State,
	init,
	Dispatch,
	SearchResultHit,
	SetStateAction,
	CustomFields,
	SearchEngine,
	UpdateGroupsArgument,
	UpdateParamsArgument,
};

const doc = () => document;

/**
 * Variable created by the esbuild config in jakefile.js
 */
declare const FINDKIT_CDN_ROOT: string;
declare const FINDKIT_VERSION: string;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const FINDKIT_MODULE_FORMAT: "esm" | "cjs";

/**
 * @public
 *
 * The package version
 */
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
	if (doc().readyState === "complete") {
		cb();
	} else {
		listen(
			doc(),
			"DOMContentLoaded" as any,
			() => {
				cb();
			},
			{ once: true },
		);
	}
}

type ElementSelector = string | NodeListOf<Element> | Element[] | Element;

/**
 * @public
 *
 * Callback invoked from select()
 */
export type SelectCallback<T> =
	// First argument always exists. Using separate arg type for it so it
	// works with the TS noUncheckedIndexedAccess flag
	(element: T, ...elements: T[]) => void;

/**
 * Run the given CSS selector after the DOMContentLoaded event and filter the
 * results to given instance type. Does not invoke the callback if no elements
 * where matched.
 *
 * The callback is invoked immediately when the DOMContentLoaded event has already fired.
 *
 * @param selector CSS Selector
 * @param instanceFilter Filter results to only include instances of the given implementation
 * @param cb
 */
export function select<InstanceFilter extends typeof Element>(
	selector: ElementSelector,
	instanceFilter: InstanceFilter,
	cb: SelectCallback<InstanceType<InstanceFilter>>,
) {
	const invoke = (elements: NodeListOf<Element> | Element[] | Element) => {
		const array =
			Array.isArray(elements) || elements instanceof NodeList
				? Array.from(elements)
				: [elements];

		const res: any[] = array.filter(
			(element) => element instanceof instanceFilter,
		);

		if (res.length === 0) {
			console.error(
				"[findkit] select(): No elements found for selector",
				elements,
			);
		} else {
			cb(res[0], ...res.slice(1));
		}
	};

	if (typeof selector === "string") {
		onDomContentLoaded(() => {
			invoke(doc().querySelectorAll(selector));
		});
	} else {
		invoke(selector);
	}
}

const lazyImplementation: Partial<Implementation> = {};

function createShellFunction<Key extends keyof Implementation>(name: Key) {
	return (...args: any[]): ReturnType<Implementation[Key]> => {
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

/**
 * Use search terms
 *
 * @public
 */
export const useTerms = createShellFunction("useTerms");

/**
 * Use total count of search results
 *
 * @public
 */
export const useTotal = createShellFunction("useTotal");

/**
 * Use search results
 *
 * @public
 */
export const useResults = createShellFunction("useResults");

/**
 * Read or update the search params
 *
 * @public
 */
export const useParams = createShellFunction("useParams");

/**
 * Read or update the search groups
 *
 * @public
 */
export const useGroups = createShellFunction("useGroups");

/**
 * Returns a ref for binding a inputs to the search
 *
 * Example:
 *
 * 		const ref = useInput();
 * 		<input ref={ref} type="text" />
 *
 * @public
 */
export const useInput = createShellFunction("useInput");

async function preloadStylesheet(href: string) {
	const link = doc().createElement("link");
	link.rel = "preload";
	link.as = "style";
	link.href = href;
	const promise = new Promise<void>((resolve, reject) => {
		listen(link, "load", () => {
			doc().head?.removeChild(link);
			resolve();
		});

		listen(link, "error", () => {
			reject(new Error(`[findkit] Failed to load stylesheet "${href}"`));
		});
	});
	doc().head?.appendChild(link);
	return promise;
}

async function loadScriptFromGlobal<T>(
	globalName: string,
	src: string,
): Promise<T> {
	const existing = (window as any)[globalName];
	if (existing) {
		return existing;
	}

	const script = doc().createElement("script");
	script.type = "module";

	const promise = new Promise<void>((resolve, reject) => {
		listen(script, "load", () => {
			doc().head?.removeChild(script);
			resolve();
		});

		listen(script, "error", () => {
			reject(new Error("[findkit] Failed to load implementation from: " + src));
		});
	});

	script.src = src;
	doc().head?.appendChild(script);

	await promise;

	const output = (window as any)[globalName];
	if (!output) {
		throw new Error(
			`[findkit] Global "${globalName}" was not defined by ${src}`,
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
	params?: SearchEngineParams;
	shadowDom?: boolean;
	minTerms?: number;
	css?: string;
	infiniteScroll?: boolean;
	styleSheet?: string;
	slots?: Partial<Slots>;
	load?: () => Promise<{ js: Implementation; css?: string }>;
	searchEndpoint?: string;
	container?: Element;
	monitorDocumentElementChanges?: boolean;
	router?: SearchEngineOptions["router"];
	mode?: "modal" | "plain";
	ui?: {
		lang: string;
		overrides?: Partial<TranslationStrings>;
	};
}

/**
 * The Lazy loading Findkit UI
 *
 * @public
 */
export class FindkitUI {
	#implementationPromise?: Promise<{
		js: Implementation;
		css?: string;
	}>;
	#enginePromise: Promise<SearchEngine>;
	#engineLoading = false;
	#resolveEngine!: (engine: SearchEngine) => void;

	#options: FindkitUIOptions;
	readonly events: Emitter<FindkitUIEvents>;
	#resources = new Resources();

	constructor(options: FindkitUIOptions) {
		this.#options = options;
		this.events = new Emitter(this.#instanceId);

		if (this.#isAlreadyOpened() || options.mode === "plain") {
			void this.open();
		}

		this.#enginePromise = new Promise<SearchEngine>((resolve) => {
			this.#resolveEngine = resolve;
		});
	}

	get #instanceId() {
		return this.#options.instanceId ?? "fdk";
	}

	#isAlreadyOpened() {
		if (typeof window === "undefined") {
			return false;
		}
		let search = location.search;
		if (this.#options.router === "hash") {
			search = location.hash.slice(1);
		}

		const params = new URLSearchParams(search);
		return params.has(this.#instanceId + "_q");
	}

	async #loadImplementation() {
		if (this.#implementationPromise) {
			return await this.#implementationPromise;
		}

		if (this.#options.load) {
			this.#implementationPromise = this.#options.load();
		} else {
			this.#implementationPromise = new Promise((resolve) => {
				void loadScriptFromGlobal<Implementation>(
					"FINDKIT_" + FINDKIT_VERSION,
					cdnFile("implementation.js"),
				).then((js) => resolve({ js }));
			});
		}

		void this.#implementationPromise.then((mod) => {
			Object.assign(lazyImplementation, mod.js);
		});

		const preloadStylesPromise = Promise.all(
			this.#getStyleSheets().map(async (href) => preloadStylesheet(href)),
		);

		await preloadStylesPromise;

		return await this.#implementationPromise;
	}

	preload = async () => this.#getEngine();

	#getStyleSheets(): string[] {
		const sheets = [];

		if (!this.#options.load) {
			sheets.push(cdnFile("styles.css"));
		}

		if (this.#options.styleSheet) {
			sheets.push(this.#options.styleSheet);
		}

		return sheets;
	}

	async open(terms?: string) {
		preconnect();
		const engine = await this.#getEngine();
		engine.open(terms);
	}

	async updateGroups(groups: UpdateGroupsArgument) {
		(await this.#enginePromise).updateGroups(groups);
	}

	async updateParams(params: UpdateParamsArgument) {
		(await this.#enginePromise).updateParams(params);
	}

	bindInput(selector: ElementSelector) {
		const resources = this.#resources.child();

		select(selector, HTMLInputElement, (...elements) => {
			for (const input of elements) {
				resources.create(() => listen(input, "focus", this.preload));

				void this.#enginePromise.then((engine) => {
					resources.create(() => engine.bindInput(input));
				});
			}
		});

		return resources.dispose;
	}

	async #getEngine() {
		if (this.#engineLoading) {
			return this.#enginePromise;
		}

		this.#engineLoading = true;

		const impl = await this.#loadImplementation();
		const { styleSheet: _1, load: _2, css: userCSS, ...rest } = this.#options;

		const allCSS = [impl.css, userCSS].filter(Boolean).join("\n");

		const engine = impl.js.init({
			...rest,
			css: allCSS,
			styleSheets: this.#getStyleSheets(),
			instanceId: this.#instanceId,
			events: this.events,
			searchEndpoint: this.#options.searchEndpoint,
		});

		this.#resolveEngine(engine);

		return engine;
	}

	async close() {
		if (this.#engineLoading) {
			(await this.#enginePromise).close();
		}
	}

	/**
	 * Unbind all event listeners, close the modal and remove it from the DOM
	 */
	async dispose() {
		this.#resources.dispose();
		if (this.#engineLoading) {
			(await this.#enginePromise).dispose();
		}
	}

	async setUIStrings(lang: string, overrides?: Partial<TranslationStrings>) {
		(await this.#enginePromise).setUIStrings(lang, overrides);
	}

	#handleOpenClick = (e: {
		target: unknown;
		preventDefault(): void;
		metaKey?: boolean;
		ctrlKey?: boolean;
		shiftKey?: boolean;
		which?: number;
	}) => {
		if (e.target instanceof HTMLAnchorElement) {
			// Requests for new tab or window
			if (e.ctrlKey || e.shiftKey || e.metaKey || e.which === 2) {
				return;
			}
		}

		e.preventDefault();
		void this.open();
	};

	/**
	 * Add additional elements to focus trap when modal is open
	 *
	 * @param selector A CSS selector or an element
	 * @returns cleanup function
	 */
	trapFocus(selector: ElementSelector) {
		const resources = this.#resources.child();
		select(selector, HTMLElement, (...elements) => {
			void this.#enginePromise.then((engine) => {
				resources.create(() => engine.trapFocus(elements));
			});
		});

		return resources.dispose;
	}

	/**
	 * Open the modal from the given elements. If a string is given it is used
	 * as a query selector to find the elements after the DOMContentLoaded
	 * event.
	 *
	 * The implementation is preloaded on mouseover.
	 *
	 * @param selector
	 * @returns unbind function
	 */
	openFrom(selector: ElementSelector) {
		const resources = this.#resources.child();

		select(selector, HTMLElement, (...elements) => {
			// Use `Resources` to create the the bindings. This ensures that
			// bindings are not created if the unbind function is called before
			// the DOMContentLoaded event.
			for (const el of elements) {
				resources.create(() => listen(el, "click", this.#handleOpenClick));
				resources.create(() =>
					listen(el, "mouseover", this.preload, {
						once: true,
						passive: true,
					}),
				);
			}
		});

		return resources.dispose;
	}
}
