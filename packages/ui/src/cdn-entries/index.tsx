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
import type { Slots, SlotProps, MakeSlotComponents } from "../core-hooks";
import type {
	ModalImplementation,
	Dispatch,
	SetStateAction,
	SearchResultHitWithGroupId,
} from "./implementation";
import type { init } from "../modal";
import type { CustomFields } from "@findkit/fetch";
import { Emitter, FindkitUIEvents } from "../emitter";
import type { TranslationStrings } from "../translations";

export {
	SearchResultHitWithGroupId,
	TranslationStrings,
	Emitter,
	MakeSlotComponents,
	SearchEngineParams,
	FindkitUIEvents,
	FindkitURLSearchParams,
	RouterBackend,
	GroupDefinition,
	Slots,
	SlotProps,
	ModalImplementation,
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
	if (/complete|interactive|loaded/.test(doc().readyState)) {
		cb();
	} else {
		doc().addEventListener(
			"DOMContentLoaded",
			() => {
				cb();
			},
			{ once: true },
		);
	}
}

const lazyImplementation: Partial<ModalImplementation> = {};

function createShellFunction<Key extends keyof ModalImplementation>(name: Key) {
	return (...args: any[]): ReturnType<ModalImplementation[Key]> => {
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
	src: string,
): Promise<T> {
	const existing = (window as any)[globalName];
	if (existing) {
		return existing;
	}

	const script = doc().createElement("script");
	script.type = "module";

	const promise = new Promise<void>((resolve, reject) => {
		script.addEventListener("load", () => {
			doc().head?.removeChild(script);
			resolve();
		});

		script.addEventListener("error", () => {
			reject(new Error("[findkit] Failed to implementation from: " + src));
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
	load?: () => Promise<ModalImplementation>;
	searchEndpoint?: string;
	container?: Element;
	monitorDocumentElementChanges?: boolean;
	router?: SearchEngineOptions["router"];
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
	#implementationPromise?: Promise<ModalImplementation>;
	#enginePromise: Promise<SearchEngine>;
	#engineLoading = false;
	#resolveEngine!: (engine: SearchEngine) => void;

	#options: FindkitUIOptions;
	readonly events: Emitter<FindkitUIEvents>;

	constructor(options: FindkitUIOptions) {
		this.#options = options;
		this.events = new Emitter(this.#instanceId);

		if (this.#isAlreadyOpened() || options.container) {
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
			this.#implementationPromise = loadScriptFromGlobal<ModalImplementation>(
				"FINDKIT_" + FINDKIT_VERSION,
				cdnFile("implementation.js"),
			);
		}

		void this.#implementationPromise.then((mod) => {
			Object.assign(lazyImplementation, mod);
		});

		const preloadStylesPromise = Promise.all(
			this.#getStyleSheets().map(async (href) => preloadStylesheet(href)),
		);

		await preloadStylesPromise;

		return await this.#implementationPromise;
	}

	async preload() {
		await this.#getEngine();
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
	}

	async updateGroups(groups: UpdateGroupsArgument) {
		(await this.#enginePromise).updateGroups(groups);
	}

	async updateParams(params: UpdateParamsArgument) {
		(await this.#enginePromise).updateParams(params);
	}

	async bindInput(input: HTMLInputElement) {
		(await this.#enginePromise).bindInput(input);
	}

	async #getEngine() {
		if (this.#engineLoading) {
			return this.#enginePromise;
		}

		this.#engineLoading = true;

		const impl = await this.#loadImplementation();
		const { styleSheet: _1, load: _2, ...rest } = this.#options;
		const engine = impl.init({
			...rest,
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

	async dispose() {
		(await this.#enginePromise).dispose();
	}

	async setUIStrings(lang: string, overrides?: Partial<TranslationStrings>) {
		(await this.#enginePromise).setUIStrings(lang, overrides);
	}

	#handleHover = () => {
		void this.preload();
	};

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

	#bindOpeners(elements: Element[] | NodeListOf<Element>) {
		for (const el of elements) {
			el.addEventListener("click", this.#handleOpenClick);
			el.addEventListener("mouseover", this.#handleHover, {
				once: true,
				passive: true,
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
