import type {
	GroupDefinition,
	SearchEngine,
	State,
	SearchResultHit,
	UpdateGroupsArgument,
	UpdateParamsArgument,
	SearchParams,
	FindkitURLSearchParams,
	Status,
	GroupOrder,
} from "../search-engine";
import type { RouterBackend } from "../router";
import type {
	Implementation,
	SearchResultHitWithGroupId,
} from "./implementation";
import type { init } from "../modal";
import type { CustomFields } from "@findkit/fetch";
import {
	Emitter,
	FindkitUIEvents,
	StatusChangeEvent,
	DebouncedSearchEvent,
	FetchDoneEvent,
	FetchEvent,
	OpenEvent,
	RequestOpenEvent,
	GroupsChangeEvent,
	ParamsChangeEvent,
	HitClickEvent,
} from "../emitter";
import type { TranslationStrings } from "../translations";
import { listen, Resources } from "../resources";
import type {
	Slots,
	HeaderSlotProps,
	ContentSlotProps,
	LayoutSlotProps,
} from "../slots";
import type { PreactFunctions } from "./preact-subset";

/**
 * @deprecated legacy alias of SearchParams
 */
export type SearchEngineParams = SearchParams;

export {
	StatusChangeEvent,
	DebouncedSearchEvent,
	FetchDoneEvent,
	FetchEvent,
	OpenEvent,
	RequestOpenEvent,
	GroupsChangeEvent,
	ParamsChangeEvent,
	HitClickEvent,
	PreactFunctions,
	Status,
	HeaderSlotProps,
	ContentSlotProps,
	LayoutSlotProps,
	SearchResultHitWithGroupId,
	TranslationStrings,
	Emitter,
	SearchParams,
	FindkitUIEvents,
	FindkitURLSearchParams,
	RouterBackend,
	GroupDefinition,
	Slots,
	Implementation,
	State,
	init,
	SearchResultHit,
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
	if (/interactive|complete/.test(doc().readyState)) {
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

/**
 * Set of DOM elements as CSS selector, a NodeList or an array of DOM elements
 */
export type ElementSelector<El extends Element> =
	| string
	| NodeListOf<El>
	| El[]
	| El;

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
	selector: ElementSelector<InstanceType<InstanceFilter>>,
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

function createShellFunction<Key extends Methods<Implementation>>(name: Key) {
	return (...args: any[]): ReturnType<Implementation[Key]> => {
		const fn = lazyImplementation[name] as any;
		if (!fn) {
			throw new Error(`[findkit] Implementation for "${name}" not loaded yet!`);
		}

		return fn(...args);
	};
}

const preactImplementation: PreactFunctions = {} as any;

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
 * Lazily loaded preact hooks
 *
 * @public
 */
export const preact: PreactFunctions = new Proxy(
	{},
	{
		get: (cache: any, prop) => {
			const anyPreact = preactImplementation as any;

			// Generate and cache proxy functions to ensure stable indendities
			if (!cache[prop]) {
				cache[prop] = (...args: any[]) => {
					if (!anyPreact) {
						throw new Error(
							`[findkit] Cannot use '${String(prop)}': Preact not loaded yet!`,
						);
					}

					return anyPreact[prop](...args);
				};
			}

			return cache[prop];
		},
	},
) as any;

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
 * Return total hit count. Includes count from all groups if multiple groups are used.
 */
export const useTotalHitCount = createShellFunction("useTotalHitCount");

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
			link.remove();
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
			script.remove();
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
	params?: SearchParams;
	shadowDom?: boolean;
	minTerms?: number;
	css?: string;
	infiniteScroll?: boolean;
	fetchCount?: number;
	header?: boolean;
	pageScroll?: boolean;
	styleSheet?: string;
	slots?: Partial<Slots>;
	load?: () => Promise<{ js: Implementation; css?: string }>;
	searchEndpoint?: string;
	container?: Element | string;
	monitorDocumentElementChanges?: boolean;
	router?: "memory" | "querystring" | "hash" | RouterBackend;
	lockScroll?: boolean;
	modal?: boolean;
	groupOrder?: GroupOrder;
	ui?: {
		lang?: string;
		overrides?: Partial<TranslationStrings>;
	};
}

/**
 * Like `Parameters<typeof fn>` but for class methods
 *
 * Example:  `Parameters<typeof HubDB, "ensureUser">[0]`
 */
export type MethodParameters<
	Klass extends new (...args: any) => any,
	Method extends keyof InstanceType<Klass>,
> = Parameters<InstanceType<Klass>[Method]>;

/**
 * Get union of class method names
 */
type Methods<Klass> = {
	[Method in keyof Klass]: Klass[Method] extends (...args: any) => any
		? Method
		: never;
}[keyof Klass];

/**
 * The Lazy loading Findkit UI
 *
 * @public
 */
export class FindkitUI {
	private PRIVATE_engine?: SearchEngine;
	private PRIVATE_loading = false;

	private PRIVATE_options: FindkitUIOptions;
	private PRIVATE_events: Emitter<FindkitUIEvents, FindkitUI>;
	private PRIVATE_resources = new Resources();

	/**
	 * The container element. Available after the "loaded" event.
	 */
	container?: Element;

	constructor(options: FindkitUIOptions) {
		this.PRIVATE_options = options;
		this.PRIVATE_events = new Emitter(this);

		if (this.PRIVATE_isAlreadyOpened() || options.modal === false) {
			void this.open();
		}

		this.PRIVATE_events.emit("init", {});
	}

	/**
	 * Close the modal
	 */
	close = this.PRIVATE_proxy("close");

	/**
	 * Update the translation strings
	 */
	setUIStrings = this.PRIVATE_proxy("setUIStrings");

	/**
	 * Update groups
	 */
	updateGroups = this.PRIVATE_proxy("updateGroups");

	get groups(): GroupDefinition[] {
		return (
			this.PRIVATE_engine?.getGroupsSnapshot() ??
			this.PRIVATE_options.groups ??
			[]
		);
	}

	/**
	 * Update search params
	 */
	updateParams = this.PRIVATE_proxy("updateParams");

	get params(): SearchParams {
		return (
			this.PRIVATE_engine?.getParamsSnapshot() ??
			this.PRIVATE_options.params ?? {
				tagQuery: [],
			}
		);
	}

	/**
	 * Bind an event handler to the emitter
	 *
	 * @returns a function to unbind the handler
	 */
	on<EventName extends keyof FindkitUIEvents>(
		eventName: EventName,
		handler: (
			event: FindkitUIEvents[EventName] & { source: FindkitUI },
		) => void,
	) {
		return this.PRIVATE_events.on(eventName, handler);
	}

	/**
	 * Bind an event handler to the emitter
	 *
	 * @returns a function to unbind the handler
	 */
	once<EventName extends keyof FindkitUIEvents>(
		eventName: EventName,
		handler: (
			event: FindkitUIEvents[EventName] & { source: FindkitUI },
		) => void,
	) {
		return this.PRIVATE_events.once(eventName, handler);
	}

	/**
	 * The search terms used on the last search
	 */
	terms() {
		return this.PRIVATE_engine?.state.usedTerms ?? "";
	}

	status(): Status {
		return this.PRIVATE_engine?.state.status ?? "waiting";
	}

	/**
	 * Unbind all event listeners, close the modal and remove it from the DOM
	 */
	dispose() {
		this.close();
		this.PRIVATE_resources.dispose();
	}

	/**
	 * Create proxy method for SearchEngine which is called once the engine is
	 * loaded
	 */
	private PRIVATE_proxy<Method extends Methods<SearchEngine>>(method: Method) {
		return (...args: MethodParameters<typeof SearchEngine, Method>) => {
			this.PRIVATE_withEngine((engine: any) => {
				engine[method](...args);
			});
		};
	}

	private PRIVATE_withEngine(fn: (engine: SearchEngine) => void) {
		if (this.PRIVATE_engine) {
			fn(this.PRIVATE_engine);
		} else {
			this.PRIVATE_events.once("loaded", (e) => {
				fn(e.__engine);
			});
		}
	}

	/**
	 * The instance id
	 */
	get id() {
		return this.PRIVATE_options.instanceId ?? "fdk";
	}

	private PRIVATE_isAlreadyOpened() {
		if (typeof window === "undefined") {
			return false;
		}
		let search = location.search;
		if (this.PRIVATE_options.router === "hash") {
			search = location.hash.slice(1);
		}

		const params = new URLSearchParams(search);
		return params.has(this.id + "_q");
	}

	preload = async () => this.PRIVATE_initEngine();

	PRIVATE_getStyleSheets(): string[] {
		const sheets = [];

		if (!this.PRIVATE_options.load) {
			sheets.push(cdnFile("styles.css"));
		}

		if (this.PRIVATE_options.styleSheet) {
			sheets.push(this.PRIVATE_options.styleSheet);
		}

		return sheets;
	}

	open(terms?: string) {
		this.PRIVATE_events.emit("request-open", {
			preloaded: !!this.PRIVATE_engine,
		});
		preconnect();
		void this.PRIVATE_initEngine();
		this.PRIVATE_withEngine((engine) => {
			engine.open(terms);
		});
	}

	private async PRIVATE_loadImplementation() {
		let promise: Promise<{ js: Implementation; css?: string }>;

		if (this.PRIVATE_options.load) {
			promise = this.PRIVATE_options.load();
		} else {
			promise = loadScriptFromGlobal<Implementation>(
				"FINDKIT_" + FINDKIT_VERSION,
				cdnFile("implementation.js"),
			).then((js) => ({ js }));
		}

		const preloadStylesPromise = Promise.all(
			this.PRIVATE_getStyleSheets().map(async (href) =>
				preloadStylesheet(href),
			),
		);

		await preloadStylesPromise;

		return await promise;
	}

	private async PRIVATE_initEngine() {
		if (this.PRIVATE_loading || this.PRIVATE_engine) {
			return;
		}

		this.PRIVATE_loading = true;

		const impl = await this.PRIVATE_loadImplementation();

		Object.assign(lazyImplementation, impl.js);
		Object.assign(preactImplementation, impl.js.preact);

		const {
			styleSheet: _1,
			load: _2,
			css: userCSS,
			...rest
		} = this.PRIVATE_options;

		const allCSS = [impl.css, userCSS].filter(Boolean).join("\n");

		const createEngine = (container?: Element) => {
			this.PRIVATE_resources.create(() => {
				const { engine, host } = impl.js.init({
					...rest,
					container,
					css: allCSS,
					styleSheets: this.PRIVATE_getStyleSheets(),
					instanceId: this.id,
					events: this.PRIVATE_events,
					searchEndpoint: this.PRIVATE_options.searchEndpoint,
				});

				this.PRIVATE_engine = engine;
				this.PRIVATE_loading = true;
				this.container = host;
				this.PRIVATE_events.emit("loaded", {
					__engine: engine,
					container: host,
				});

				return engine.dispose;
			});
		};

		if (this.PRIVATE_options.container) {
			select(this.PRIVATE_options.container, Element, createEngine);
		} else {
			createEngine();
		}
	}

	private PRIVATE_handleOpenClick = (e: {
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
	trapFocus(selector: ElementSelector<HTMLElement>) {
		const resources = this.PRIVATE_resources.child();
		select(selector, HTMLElement, (...elements) => {
			this.PRIVATE_withEngine((engine) => {
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
	openFrom(selector: ElementSelector<HTMLElement>) {
		const resources = this.PRIVATE_resources.child();

		select(selector, HTMLElement, (...elements) => {
			// Use `Resources` to create the the bindings. This ensures that
			// bindings are not created if the unbind function is called before
			// the DOMContentLoaded event.
			for (const el of elements) {
				resources.create(() =>
					listen(el, "click", this.PRIVATE_handleOpenClick),
				);
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

	bindInput(selector: ElementSelector<HTMLInputElement>) {
		const resources = this.PRIVATE_resources.child();

		select(selector, HTMLInputElement, (...elements) => {
			for (const input of elements) {
				resources.create(() => listen(input, "focus", this.preload));

				this.PRIVATE_withEngine((engine) => {
					resources.create(() => engine.bindInput(input));
				});
			}
		});

		return resources.dispose;
	}
}
