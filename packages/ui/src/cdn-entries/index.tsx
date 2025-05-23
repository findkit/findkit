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
	Sort,
	CustomRouterData,
	GroupsOrDefault,
	SearchParamsOrDefault,
	CustomRouterDataSetter,
} from "../search-engine";
import type { RouterBackend } from "../router";
import type {
	Implementation,
	SearchResultHitWithGroupId,
} from "./implementation";
import type { LayeredCSS, init } from "../modal";
import type { CustomFields } from "@findkit/fetch";
import { inferSearchEndpoint } from "@findkit/fetch";
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
	LanguageChangeEvent,
	ParamsChangeEvent,
	HitClickEvent,
	BindInputEvent,
	UnbindInputEvent,
	lazyValue,
	CustomRouterDataEvent,
	InitEvent,
} from "../emitter";
import type { TranslationStrings } from "../translations";
import { listen, Resources } from "../resources";
import type {
	Slots,
	HeaderSlotProps,
	ContentSlotProps,
	LayoutSlotProps,
	GroupSlotProps,
	ShowAllLinkProps,
	HitSlotProps,
	HeaderSlotParts,
	HitSlotParts,
	GroupSlotParts,
	ResultSlotProps,
	ResultSlotParts,
} from "../slots";
import type { PreactFunctions } from "./preact-subset";
import type { Filter, Operator } from "../filter-type";
import type { GroupResults } from "../core-hooks";

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
	LanguageChangeEvent,
	BindInputEvent,
	UnbindInputEvent,
	CustomRouterDataEvent,
	CustomRouterData,
	CustomRouterDataSetter,
	Filter,
	Operator,
	Sort,
	GroupSlotProps,
	GroupSlotParts,
	HeaderSlotParts,
	ShowAllLinkProps,
	HitSlotParts,
	HitSlotProps,
	InitEvent,
	ResultSlotProps,
	ResultSlotParts,
	GroupResults,
};

// Just to make minification to work better.
const doc = globalThis.document;

const throwImplementationNotLoaded = (msg: string): never => {
	throw new Error(`[findkit] Not loaded. Cannot use ${msg}`);
};

const logError = (...args: any[]) => {
	console.error("[findkit]", ...args);
};

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

export const MODULE_FORMAT = FINDKIT_MODULE_FORMAT;

function cdnFile(path: string) {
	const root = FINDKIT_CDN_ROOT;
	if (path.endsWith(".js")) {
		return `${root}/esm/${path}`;
	} else {
		return `${root}/${path}`;
	}
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
	if (doc.readyState !== "loading") {
		cb();
	} else {
		listen(
			doc,
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
			logError("select(): No elements found with", elements);
		} else {
			cb(res[0], ...res.slice(1));
		}
	};

	if (typeof selector === "string") {
		onDomContentLoaded(() => {
			invoke(doc.querySelectorAll(selector));
		});
	} else {
		invoke(selector);
	}
}

const lazyImplementation: Partial<Implementation> = { css };

/**
 * Like the PRIVATE_createShellMethod but for standalone functions
 */
function createShellFunction<Key extends Methods<Implementation>>(
	name: Key,
): Implementation[Key] {
	return (...args: any[]): ReturnType<Implementation[Key]> => {
		const fn = lazyImplementation[name] as any;
		if (!fn) {
			throwImplementationNotLoaded(name);
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
 * Manage custom router data from a slot override
 *
 * @public
 */
export const useCustomRouterData = createShellFunction("useCustomRouterData");

function proxyFunctions<T extends object>(target: T): T {
	const cache: any = {};

	return new Proxy(target, {
		get: (target, prop) => {
			// Generate and cache proxy functions to ensure stable indendities
			if (!cache[prop]) {
				cache[prop] = (...args: any[]) => {
					const actual = (target as any)?.[prop];
					if (!actual) {
						throwImplementationNotLoaded(String(prop));
					}

					return actual.apply(target, args);
				};
			}

			return cache[prop];
		},
	}) as any;
}

/**
 * Lazily loaded preact hooks
 *
 * @public
 */
export const preact: PreactFunctions = proxyFunctions(preactImplementation);

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
 * Return true when the search is loading something for too long. Works like
 * the `loading` event.
 */
export const useLoading = createShellFunction("useLoading");

/**
 * Returns a ref for binding an inputs to the search
 *
 * Example:
 *
 * 		const ref = useInput();
 * 		<input ref={ref} type="text" />
 *
 * @public
 */
export const useInput = createShellFunction("useInput");

/**
 * Get the current ui language
 */
export const useLang = createShellFunction("useLang");

/**
 * Get the translate function.
 */
export const useTranslate = createShellFunction("useTranslate");

async function preloadStylesheet(style: LayeredCSS) {
	const href = typeof style === "string" ? style : style.href;
	if (!href) {
		return;
	}

	const link = doc.createElement("link");
	link.rel = "preload";
	link.as = "style";
	link.href = href;

	const promise = new Promise<any>((resolve) => {
		// Fallback in case the load event is not fired on some random broken
		// browser
		setTimeout(resolve, 2000);

		listen(link, "load", resolve, { once: true });
		listen(
			link,
			"error",
			() => {
				logError(`Failed to load stylesheet ${href}`);
				// do not error the promise because it can  work without user css too
				resolve({});
			},
			{ once: true },
		);
	});

	doc.head.appendChild(link);

	await promise;

	link.remove();
}

async function loadScriptFromGlobal<T>(
	globalCallbackName: string,
	src: string,
): Promise<T> {
	const anyWindow = window as any;
	const promiseKey = `${globalCallbackName}_promise`;

	if (anyWindow[promiseKey]) {
		return anyWindow[promiseKey];
	}

	const promise = new Promise<T>((resolve, reject) => {
		const script = doc.createElement("script");
		script.type = "module";

		const timer = setTimeout(() => {
			reject(
				new Error(
					`[findkit] Timeout loading script ${src} with ${globalCallbackName}`,
				),
			);
		}, 10000);

		// Using callback based loading because the script "load" event does not
		// seem to fire even on modern browsers 100% of the time. 1.3.2023 I
		// observed Chrome 110 not firing it when the page was loaded with cold
		// cache. This was with normal script tags, not using the "module" but
		// module script seem to have their own issues:
		// https://github.com/whatwg/html/issues/6421
		Object.assign(window, {
			[globalCallbackName](js: any) {
				delete (window as any)[globalCallbackName];
				clearTimeout(timer);
				script.remove();
				resolve(js);
			},
		});

		script.src = src;
		doc.head.appendChild(script);
	});

	anyWindow[promiseKey] = promise;
	return promise;
}

/**
 * Modal options
 *
 * @public
 */
export interface FindkitUIOptions<T extends FindkitUIGenerics> {
	publicToken: string;
	instanceId?: string;
	separator?: string;
	/**
	 * See {@link GroupDefinition}
	 */
	groups?: T["groups"];

	defaultCustomRouterData?: T["customRouterData"];

	/**
	 * See {@link SearchParams}
	 */
	params?: T["params"];
	shadowDom?: boolean;
	cssLayers?: boolean;
	minTerms?: number;
	css?: string;
	infiniteScroll?: boolean;
	fetchCount?: number;
	header?: boolean;
	styleSheet?: string;
	closeOnOutsideClick?: boolean;
	backdrop?: boolean;
	inert?: string | boolean;

	groupKey?: string;
	searchKey?: string;
	customRouterDataPrefix?: string;

	/**
	 * See {@link Slots}
	 */
	slots?: Partial<Slots>;
	load?: () => Promise<{ js: Implementation; css?: string }>;
	searchEndpoint?: string;
	container?: Element | string;
	monitorDocumentLang?: boolean;
	router?: "memory" | "querystring" | "hash" | RouterBackend<{}>;
	lockScroll?: boolean;
	modal?: boolean;
	forceHistoryReplace?: boolean;
	manageScroll?: boolean;
	builtinStyles?: boolean;

	/**
	 * See {@link GroupOrder}
	 */
	groupOrder?: GroupOrder;
	fontDivisor?: number;
	fetchThrottle?: number;

	/**
	 * Set the UI language
	 */
	lang?: string;

	/**
	 * See {@link TranslationStrings}
	 */
	translations?: { [lang: string]: Partial<TranslationStrings> };

	/**
	 * Timeout for the `loading` event
	 */
	loadingThrottle?: number;
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
 * Generic type for defining custom ui.params  and ui.updateParams() types
 *
 * @public
 */
export interface FindkitUIGenerics {
	params?: SearchParams;
	groups?: [GroupDefinition, ...GroupDefinition[]];
	customRouterData?: CustomRouterData;
}

/**
 * The Lazy loading Findkit UI
 *
 * https://docs.findkit.com/ui/api/
 *
 * @public
 */
export class FindkitUI<
	G extends FindkitUIGenerics = FindkitUIGenerics,
	O extends FindkitUIOptions<G> = FindkitUIOptions<G>,
	E extends FindkitUIEvents<G, O> = FindkitUIEvents<G, O>,
> {
	private PRIVATE_loading = false;

	private PRIVATE_options: O;
	private PRIVATE_events: Emitter<E, FindkitUI<G, O>>;
	private PRIVATE_resources = new Resources();
	private PRIVATE_lazyEngine = lazyValue<SearchEngine>();

	/**
	 * The container element. Available after the "loaded" event.
	 */
	container?: Element;

	/**
	 * True when the implementation has been loaded
	 */
	loaded = false;

	constructor(options: O) {
		const initialInstanceId = options.instanceId ?? "fdk";
		this.PRIVATE_options = options;
		this.PRIVATE_events = new Emitter<E, FindkitUI<G, O>>(this as any);
		const utils = proxyFunctions(
			lazyImplementation,
		) as Required<Implementation>;

		const mutableWrap = {
			// readonly instanceId so the original instance id is
			// detectable even if it is modified in the options
			instanceId: initialInstanceId,
			utils,
			preact,
			options: { ...options, instanceId: initialInstanceId },
		};

		this.PRIVATE_events.emit("init", mutableWrap);
		// Set the options again since the event handler might have modified them
		this.PRIVATE_options = mutableWrap.options;

		this.emitLoadingEvents();

		if (
			this.PRIVATE_isAlreadyOpened() ||
			options.modal === false ||
			(typeof options.modal !== "boolean" && options.container)
		) {
			void this.open();
		}
	}

	private emitLoadingEvents() {
		const emitter = this.PRIVATE_events;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let eventCount = 0;
		let loading = false;

		const emitLoading = () => {
			eventCount++;

			// already going to fire
			if (timer) {
				return;
			}

			timer = setTimeout(() => {
				timer = undefined;
				if (!loading) {
					loading = true;
					emitter.emit("loading", {});
					this.PRIVATE_lazyEngine((engine) => {
						engine.state.loading = loading;
					});
				}
			}, this.PRIVATE_options.loadingThrottle ?? 1000);
		};

		const emitDone = () => {
			// Use small timeout on done event too to skip it if another loading
			// event is fired soon after the last one
			setTimeout(() => {
				eventCount--;

				// Fire done only after all concurrent loading events are done
				if (eventCount > 0) {
					return;
				}

				// Do not fire loading event if the done event was fired before
				clearTimeout(timer);
				timer = undefined;

				if (loading) {
					loading = false;
					emitter.emit("loading-done", {});
					this.PRIVATE_lazyEngine((engine) => {
						engine.state.loading = loading;
					});
				}
			}, 10);
		};

		emitter.on("fetch", emitLoading);
		emitter.on("fetch-done", emitDone);
		emitter.once("request-open", (e) => {
			if (!e.preloaded) {
				emitLoading();
				emitter.once("loaded", emitDone);
			}
		});
	}

	/**
	 * Close the modal
	 *
	 * https://docs.findkit.com/ui/api/#close
	 */
	close = this.PRIVATE_createShellMethod("close");

	/**
	 * Set the current UI language
	 *
	 * https://docs.findkit.com/ui/api/#setLang
	 */
	setLang = this.PRIVATE_createShellMethod("setLang");

	/**
	 * Set the UI translations transt for a given language
	 *
	 * https://docs.findkit.com/ui/api/#addTranslation
	 *
	 * @params lang - language code
	 * @params translations - translations object
	 * @params custom - Additional custom translations when using the useTranslator in slot overrides
	 */
	addTranslation = this.PRIVATE_createShellMethod("addTranslation");

	/**
	 * Update groups
	 */
	updateGroups: (arg: UpdateGroupsArgument<GroupsOrDefault<G, O>>) => void =
		this.PRIVATE_createShellMethod("updateGroups") as any;

	setCustomRouterData: (data: NonNullable<G["customRouterData"]>) => void =
		this.PRIVATE_createShellMethod("setCustomRouterData");

	get customRouterData(): G["customRouterData"] {
		const engine = this.PRIVATE_lazyEngine.get();
		if (!engine) {
			throwImplementationNotLoaded(
				".customRouterData — See https://findk.it/customRouterData",
			);
		}

		return (
			engine?.getCustomRouterData() ??
			this.PRIVATE_options.defaultCustomRouterData
		);
	}

	get groups(): GroupsOrDefault<G, O> {
		return (this.PRIVATE_lazyEngine.get()?.getGroups() ??
			this.PRIVATE_options.groups ??
			[]) as any;
	}

	/**
	 * Update search params
	 */
	updateParams: (
		arg: UpdateParamsArgument<SearchParamsOrDefault<G, O>>,
	) => void = this.PRIVATE_createShellMethod("updateParams");

	/**
	 * https://docs.findkit.com/ui/api/#params
	 */
	get params(): SearchParamsOrDefault<G, O> {
		return (this.PRIVATE_lazyEngine.get()?.getParams() ??
			this.PRIVATE_options.params ?? {
				tagQuery: [],
			}) as any;
	}

	/**
	 * Activate group by id, index or group object. Does not open the modal.
	 *	Use with open() to open the modal as well.
	 */
	activateGroup = this.PRIVATE_createShellMethod("activateGroup");

	/**
	 * Clear possibly active group by returni the multiple groups view
	 */
	clearGroup = this.PRIVATE_createShellMethod("clearGroup");

	/**
	 * Bind an event handler to the emitter
	 *
	 * @returns a function to unbind the handler
	 */
	on<EventName extends keyof E>(
		eventName: EventName,
		handler: (event: E[EventName] & { source: FindkitUI<G> }) => void,
	) {
		return this.PRIVATE_events.on(eventName, handler as any);
	}

	/**
	 * Bind an event handler to the emitter
	 *
	 * @returns a function to unbind the handler
	 */
	once<EventName extends keyof E>(
		eventName: EventName,
		handler: (event: E[EventName] & { source: FindkitUI<G> }) => void,
	) {
		return this.PRIVATE_events.once(eventName, handler as any);
	}

	/**
	 * The search terms used on the last search
	 */
	get usedTerms() {
		return this.PRIVATE_lazyEngine.get()?.state.usedTerms ?? "";
	}

	/**
	 * @deprecated Use `usedTerms` instead
	 */
	get terms() {
		return this.usedTerms;
	}

	/**
	 * Get the possible pending terms that will be used in the next search
	 */
	get nextTerms() {
		return this.PRIVATE_lazyEngine.get()?.getNextTerms() ?? "";
	}

	/**
	 * https://docs.findkit.com/ui/api/#status
	 */
	get status(): Status {
		return this.PRIVATE_lazyEngine.get()?.state.status ?? "waiting";
	}

	/**
	 * Unbind all event listeners, close the modal and remove it from the DOM
	 */
	dispose() {
		this.close();
		this.PRIVATE_resources.dispose();
	}

	/**
	 * Create a "shell" method for SearchEngine methods. Using this it possible
	 * call SearcnEngine methods before the engine is loaded without throwing
	 * errors. The actual method is called when the engine is loads. If the
	 * engine is already loaded the method is called synchronously.
	 */
	private PRIVATE_createShellMethod<
		Method extends
			| "setLang"
			| "close"
			| "dispose"
			| "updateGroups"
			| "setCustomRouterData"
			| "updateParams"
			| "addTranslation"
			| "bindInput"
			| "activateGroup"
			| "clearGroup",
		// Methods<SearchEngine>,
	>(method: Method): InstanceType<typeof SearchEngine>[Method] {
		// NOTE: Supports only void returning methods
		return (...args: any[]): any => {
			this.PRIVATE_lazyEngine((engine: any) => {
				engine[method](...args);
			});
		};
	}

	/**
	 * The instance id
	 */
	get id() {
		return this.PRIVATE_options.instanceId ?? "fdk";
	}

	/**
	 * The separator
	 */
	get separator() {
		return this.PRIVATE_options.separator ?? "_";
	}

	/**
	 * InstanceId + separator + q
	 * or searchKey if defined
	 */
	get searchKey() {
		return this.PRIVATE_options.searchKey ?? this.id + this.separator + "q";
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
		return params.has(this.searchKey);
	}

	preload = async () => {
		await this.PRIVATE_initEngine();
		await new Promise((resolve) => {
			this.PRIVATE_lazyEngine(resolve);
		});
	};

	/**
	 * Return css file urls
	 */
	private PRIVATE_getStyleSheets(): LayeredCSS[] {
		const sheets: LayeredCSS[] = [];

		// If there is a load option we asume it returns the css too. So we can
		// skip loading the cdn css.
		if (
			!this.PRIVATE_options.load &&
			this.PRIVATE_options.builtinStyles !== false
		) {
			sheets.push({ href: cdnFile("styles.css"), layer: "findkit.core" });
		}

		if (this.PRIVATE_options.styleSheet) {
			sheets.push({
				href: this.PRIVATE_options.styleSheet,
				layer: "findkit.user",
			});
		}

		return sheets;
	}

	/**
	 * https://docs.findkit.com/ui/api/#open
	 */
	open(terms?: string, options?: { toggle?: boolean }) {
		this.PRIVATE_events.emit("request-open", {
			preloaded: !!this.PRIVATE_lazyEngine.get(),
		});
		void this.PRIVATE_initEngine();
		this.PRIVATE_lazyEngine((engine) => {
			engine.open(terms, options);
		});
	}

	/**
	 * https://docs.findkit.com/ui/api/#togggle
	 */
	toggle() {
		this.open(undefined, { toggle: true });
	}

	/**
	 * https://docs.findkit.com/ui/api/#search
	 */
	search(terms: string) {
		this.open(terms);
	}

	private async PRIVATE_loadImplementation(): Promise<{
		js: Implementation;
		css?: string;
	}> {
		// Start preloading the css in the background
		const cssPreloadPromise = Promise.all(
			this.PRIVATE_getStyleSheets().map(preloadStylesheet),
		);

		let implPromise: Promise<{
			js: Implementation;
			css?: string;
		}>;

		if (this.PRIVATE_options.load) {
			implPromise = this.PRIVATE_options.load();
		} else {
			implPromise = loadScriptFromGlobal<Implementation>(
				"FINDKIT_LOADED_" + FINDKIT_VERSION,
				cdnFile("implementation.js"),
			).then((js) => ({ js }));
		}

		// Wait for the css to load fully to avoid flashes of unstyled content
		await cssPreloadPromise;

		return await implPromise;
	}

	private async PRIVATE_initEngine() {
		if (this.PRIVATE_loading || this.PRIVATE_lazyEngine.get()) {
			return;
		}

		const endpoint = inferSearchEndpoint(this.PRIVATE_options) + "&warmup";

		// Run warm up in background. No need to wait for it since it does not matter
		// if we are faster since the return value is not used anyway.
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: "{}",
		}).catch(() => {
			// No need to handle errors here. If the warmup fails the search
			// will fail too which shows the error
		});

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

		const allCSS: LayeredCSS[] = this.PRIVATE_getStyleSheets();

		if (impl.css) {
			allCSS.push({ css: impl.css, layer: "findkit.core" });
		}

		if (userCSS) {
			allCSS.push({ css: userCSS, layer: "findkit.user" });
		}

		const createEngine = (container?: Element) => {
			this.PRIVATE_resources.create(() => {
				const { engine, host } = impl.js._init({
					...rest,
					container,
					layeredCSS: allCSS,
					instanceId: this.id,
					events: this.PRIVATE_events as any,
					searchEndpoint: this.PRIVATE_options.searchEndpoint,
				});

				this.PRIVATE_loading = true;
				this.container = host;
				this.loaded = true;
				this.PRIVATE_lazyEngine.provide(engine);
				this.PRIVATE_events.emit("loaded", { container: host });
				engine.start();

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
		void this.toggle();
	};

	/**
	 * Open the modal from the given elements. If a string is given it is used
	 * as a query selector to find the elements after the DOMContentLoaded
	 * event.
	 *
	 * Element is not added to the focus trap automatically. If the element is
	 * visible on the page when the modal is open .focus() should be manually
	 * called on the element.
	 *
	 * The FindkitUI implementation is preloaded on mouseover.
	 *
	 * https://docs.findkit.com/ui/api/#openFrom
	 *
	 * @param selector
	 * @returns unbind function
	 */
	openFrom(selector: ElementSelector<HTMLElement>) {
		const resources = this.PRIVATE_resources.child();

		select(selector, HTMLElement, (...elements) => {
			// Use `Resources` to create the bindings. This ensures that
			// bindings are not created if the unbind function is called before
			// the DOMContentLoaded event.
			for (const el of elements) {
				resources.create(() =>
					listen(el, "click", this.PRIVATE_handleOpenClick),
				);

				// Div element with role=button does not emit click events,
				// so we must manually listen to the enter key down event
				resources.create(() =>
					listen(el, "keydown", (e) => {
						if (
							e.target instanceof HTMLElement &&
							e.key === "Enter" &&
							// Explicitly marked as a button
							e.target.role === "button"
						) {
							e.preventDefault();
							this.toggle();
						}
					}),
				);

				resources.create(() =>
					listen(el, "mouseover", this.preload, {
						once: true,
						passive: true,
					}),
				);
			}

			const clicked = elements.some((el) => el.dataset.clicked);
			if (clicked) {
				this.open();
			}
		});

		return resources.dispose;
	}

	bindInput(selector: ElementSelector<HTMLInputElement>) {
		const resources = this.PRIVATE_resources.child();

		select(selector, HTMLInputElement, (...elements) => {
			for (const input of elements) {
				resources.create(() => listen(input, "focus", this.preload));

				this.PRIVATE_lazyEngine((engine) => {
					resources.create(() => engine.bindInput(input));
				});
			}
		});

		return resources.dispose;
	}
}
