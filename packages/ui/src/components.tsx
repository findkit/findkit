import React, {
	MouseEventHandler,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { useSnapshot } from "valtio";
import {
	FindkitContext,
	FindkitContextType,
	FocusRef,
	GroupResults,
	useFindkitContext,
	useFindkitURLSearchParams,
	useKeyboardItemAttributes,
	useResults,
	useSearchEngine,
	useSearchEngineState,
	useSearchMoreOnReveal,
	useTranslator,
	useView,
} from "./core-hooks";
import { SearchEngine, SearchResultHit } from "./search-engine";
import { Slots } from "./slots";
import {
	SlotCatchBoundary,
	createSlotComponent,
	useSlotContext,
} from "./slots-core";
import { View, cn, isProd, scrollToTop } from "./utils";

export function FindkitProvider(props: {
	children: ReactNode;
	engine: SearchEngine;
	slots?: Partial<Slots>;
}) {
	const { engine } = props;
	const { lang, translations } = useSnapshot(engine.state).ui;
	const focusRef = useRef<FocusRef>({});

	const context = useMemo(() => {
		const value: FindkitContextType = {
			engine,
			// Always create new translator function identity when the lang or translations change.
			// New identity is needed to trigger re-render of the components that use the translator.
			translator: engine.createTranslator({ lang, translations }),
			slots: props.slots ?? {},
			focusRef,
		};

		return value;
	}, [engine, props.slots, lang, translations]);

	return (
		<FindkitContext.Provider value={context}>
			{props.children}
		</FindkitContext.Provider>
	);
}

function SingleGroupLink(props: {
	children: ReactNode;
	groupId: string;
	groupTitle: string;
	total: number;
}) {
	const t = useTranslator();
	const ref = useRef<HTMLAnchorElement>(null);
	const { focusRef } = useFindkitContext();
	const engine = useSearchEngine();
	const params = useFindkitURLSearchParams();
	const nextParams = params.setGroupId(props.groupId);
	const kbAttrs = useKeyboardItemAttributes(
		"single-group-link-" + props.groupId,
	);

	return (
		<View
			as="a"
			cn={["single-group-link", "group-header-footer-spacing"]}
			{...kbAttrs}
			ref={ref}
			data-kb-action
			data-internal
			aria-label={t("aria-show-all", {
				group: props.groupTitle,
				total: props.total,
			})}
			href={engine.formatHref(nextParams)}
			onClick={(e) => {
				e.preventDefault();
				if (!(e.target instanceof HTMLElement)) {
					return;
				}

				const activeElement = engine.elementHost.activeElement;
				if (
					activeElement &&
					ref.current &&
					(activeElement === ref.current || ref.current.contains(activeElement))
				) {
					focusRef.current.groupViewFocusNext = true;
				} else {
					scrollToTop(e.target);
				}
				engine.updateAddressBar(nextParams, { push: true });
			}}
		>
			{props.children ?? (
				<>
					<View cn="link-text">{t("show-all")}</View>
					<Arrow direction="right" />
				</>
			)}
			<View cn="hover-bg" />
		</View>
	);
}

/**
 * Link to go back to the multiple groups view
 */
function BackLink(props: { children?: ReactNode }) {
	const kbAttrs = useKeyboardItemAttributes("back-to-all-results");
	const engine = useSearchEngine();
	const params = useFindkitURLSearchParams();
	const t = useTranslator();
	const nextParams = params.clearGroupId();
	const slot = useSlotContext("Results");

	if (slot.groupCount === 1) {
		return null;
	}

	return (
		<View as="nav" cn="nav" aria-label={t("aria-label-search-group-nav")}>
			<View
				as="a"
				{...kbAttrs}
				data-kb-action
				data-internal
				cn={["back-link", "group-header-footer-spacing"]}
				href={engine.formatHref(nextParams)}
				onClick={(e) => {
					e.preventDefault();
					engine.updateAddressBar(nextParams, { push: true });
				}}
			>
				{props.children ?? (
					<>
						<Arrow direction="left" />
						<View cn="link-text">{t("go-back")}</View>
					</>
				)}
				<View cn="hover-bg" />
			</View>
		</View>
	);
}

function GroupTitle(props: {
	title: string;
	total: number;
	children?: ReactNode;
}) {
	const t = useTranslator();
	if (!props.children && !props.title) {
		return null;
	}

	return (
		<>
			<View as="h2" cn="group-title" aria-label={props.title}>
				{props.children ? (
					props.children
				) : (
					<>
						{props.title}{" "}
						{props.total > 0 ? (
							<span
								aria-hidden
								title={t("total-search-results-in-group")}
								className={cn("group-title-total")}
							>
								{props.total}
							</span>
						) : (
							""
						)}
					</>
				)}
			</View>
		</>
	);
}

function StarIcon(props: { title: string }) {
	return (
		<div title={props.title} className={cn("superwords-match-icon")}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				version="1.1"
				viewBox="0 0 100 100"
			>
				<path
					strokeWidth="0.265"
					d="M94.386 132.14L54.12 112.87l-38.7 22.244 5.884-44.248-33.115-29.933 43.901-8.077 18.235-40.744 21.248 39.257 44.384 4.751L85.19 88.46z"
					transform="matrix(.76096 0 0 .76096 10.374 -6.016)"
				></path>
			</svg>
		</div>
	);
}

const HitSlot = createSlotComponent("Hit", {
	errorChildren(props) {
		return (
			<>
				{props.hit.title}
				<a href={props.hit.url}>{props.hit.url}</a>
			</>
		);
	},
	parts: {
		TitleLink(props) {
			const context = useSlotContext("Hit");

			const href = props.href ?? context.hit.url;
			const superwordsMatch =
				props.superwordsMatch ?? context.hit.superwordsMatch;

			const t = useTranslator();

			return (
				<>
					<View as="h3" cn="hit-title">
						{superwordsMatch ? (
							<StarIcon title={t("superwords-match")} />
						) : null}
						<View
							as="a"
							id={context.hitId}
							lang={context.hit.language}
							cn={["hit-title-link", "link"]}
							href={href}
							data-kb-action
						>
							{props.children ?? context.hit.title}
						</View>
					</View>
				</>
			);
		},
		Highlight(props) {
			const t = useTranslator();
			const context = useSlotContext("Hit");
			const highlight = props.highlight ?? context.hit.highlight;

			return (
				<View cn="highlight" aria-label={t("aria-label-highlights")}>
					<ClickableHighlights
						higlights={highlight}
						href={context.hit.url}
						lang={context.hit.language}
					/>
				</View>
			);
		},
		URLLink(props) {
			const t = useTranslator();
			const context = useSlotContext("Hit");
			const href = props.href ?? context.hit.url;

			return (
				<View
					as="a"
					cn={["hit-url", "link"]}
					aria-label={t("aria-label-hit-url", { href })}
					href={href}
					// Duplicated link. Skip from tab order for cleaner tab navigation
					// but keep for screen readers so it can announce the URL.
					// This is also reachable by using the "links navigation" in screen readers.
					tabIndex={-1}
				>
					{props.children ?? href}
				</View>
			);
		},
	},
	render(props) {
		return (
			<>
				<props.parts.TitleLink />
				<props.parts.Highlight />
				<props.parts.URLLink />
			</>
		);
	},
});

/**
 * Get {contextSize} words around the highlighted node. Handles
 * partial words at the beginning and end of the initial node.
 */
function getHighlightContext(node: ChildNode, contextSize: number) {
	contextSize++;
	let trailingNode = node.nextSibling;
	let leadingNode = node.previousSibling;

	// Convert DOM nodes to plain string around the highlighted node
	let leading = "";
	let trailing = "";
	while (trailingNode || leadingNode) {
		trailing += trailingNode?.textContent ?? "";
		leading = (leadingNode?.textContent ?? "") + leading;

		trailingNode = trailingNode?.nextSibling ?? null;
		leadingNode = leadingNode?.previousSibling ?? null;
	}

	// The highlighted node might be a partial word inside some special characters
	// Eg. .<em>updateParams</em>() which means the actual word is .updateParams()
	// and not just updateParams.

	let prefix = "";
	// capture last partial word
	leading = leading.replace(/([^ ]+)$/, (match) => {
		prefix = match;
		return "";
	});

	let suffix = "";
	// capture first partial word
	trailing = trailing.replace(/^([^ ]+)/, (match) => {
		suffix = match;
		return "";
	});

	return (
		leading.split(" ").slice(-contextSize).join(" ") +
		prefix +
		node.textContent +
		suffix +
		trailing.split(" ").slice(0, contextSize).join(" ")
	);
}

/**
 * Parse <em> highlighted string to clickable links
 */
function ClickableHighlights(props: {
	higlights: string;
	lang: string | undefined;
	href: string;
}) {
	const t = useTranslator();
	const links = useMemo(() => {
		const dom = new DOMParser().parseFromString(props.higlights, "text/html");
		const vdom: ReactNode[] = [];

		let current: ChildNode | null = dom.body.firstChild;

		while (current) {
			if (current instanceof HTMLElement && current.tagName === "EM") {
				const words = getHighlightContext(current, 1);
				const url = new URL(props.href);

				// https://wicg.github.io/scroll-to-text-fragment/
				url.hash = `#:~:text=${encodeURIComponent(words)}`;

				vdom.push(
					<View
						title={t("aria-label-highlight-link", { words })}
						aria-label={t("aria-label-highlight-link", { words })}
						lang={props.lang}
						as="a"
						// Required according to MDN but seems to
						//  work without it too? No harm adding it.
						// https://developer.mozilla.org/en-US/docs/Web/Text_fragments#usage_notes
						rel="noopener"
						cn="em"
						href={url.toString()}
						//
						// We want tab to just to go between search hits. This would make it
						// cumbersome to navigate the results with the keyboard tab key
						// as there can be many highlights in a single hit.
						//
						// Also, this is visual only feature, so it is not so important to
						// be reachable by keyboard. That being said this is still reachable
						// with screen readers by using normal "next" operation or the "links
						// navigation" feature.
						tabIndex={-1}
					>
						{current.textContent}
					</View>,
				);
			} else {
				vdom.push(current.textContent);
			}
			current = current.nextSibling;
		}

		return vdom;
	}, [props.higlights, props.href, props.lang, t]);

	return <View lang={props.lang}>{links}</View>;
}

function isEqualWithoutHash(a: string, b: string) {
	const urlA = new URL(a);
	const urlB = new URL(b);

	urlA.hash = "";
	urlB.hash = "";

	return urlA.toString() === urlB.toString();
}

function Hit(props: {
	hit: SearchResultHit;
	groupId: string;
	containerRef: ReturnType<typeof useSearchMoreOnReveal> | undefined;
}) {
	const t = useTranslator();
	const engine = useSearchEngine();
	const ref = useRef<HTMLElement>();

	const kbAttrs = useKeyboardItemAttributes(
		`hit-${props.groupId}-${props.hit.index}`,
	);

	const hitId = engine.getUniqId(`hit-${props.groupId}-${props.hit.index}`);

	const { containerRef } = props;
	const refCallback = useCallback(
		(el: HTMLElement | null) => {
			ref.current = el ?? undefined;
			containerRef?.(el);
		},
		[containerRef],
	);

	const handleLinkClick: MouseEventHandler<HTMLDivElement> = (e) => {
		if (!(e.target instanceof HTMLAnchorElement)) {
			return;
		}

		engine.saveVisitedHitId(hitId);

		if (!isEqualWithoutHash(e.target.href, props.hit.url)) {
			return;
		}

		engine.events.emit("hit-click", {
			hit: props.hit,
			target: e.target,
			terms: engine.state.usedTerms ?? "",
			preventDefault: () => {
				e.preventDefault();
			},
		});
	};

	return (
		<View
			ref={refCallback}
			key={props.hit.url}
			role="group"
			aria-label={t("aria-label-hit", { number: props.hit.index + 1 })}
			cn={{ hit: true, "superwords-match": props.hit.superwordsMatch }}
			data-fdk-score={props.hit.score}
			data-hit-id={hitId}
			{...kbAttrs}
			onClick={handleLinkClick}
		>
			<HitSlot hit={props.hit} groupId={props.groupId} hitId={hitId} />
		</View>
	);
}

function HitList(props: {
	groupId: string;
	total: number;
	hits: ReadonlyArray<SearchResultHit>;
}) {
	const hitRef = useSearchMoreOnReveal();
	const t = useTranslator();

	if (props.total === 0) {
		return <View cn="sr-only">{t("no-results")}</View>;
	}

	return (
		<>
			{props.hits.map((hit, index) => {
				const last = index === props.hits.length - 1;
				return (
					<Hit
						key={hit.url + hit.score}
						hit={hit}
						groupId={props.groupId}
						containerRef={last ? hitRef : undefined}
					/>
				);
			})}
		</>
	);
}

const GroupSlot = createSlotComponent("Group", {
	parts: {
		Title(props) {
			const context = useSlotContext("Group");
			const title = props.title ?? context.title;

			return (
				<GroupTitle
					title={title}
					total={context.total}
					children={props.children}
				/>
			);
		},

		Hits() {
			const context = useSlotContext("Group");

			return (
				<HitList
					groupId={context.id}
					total={context.total}
					hits={context.hits.slice(0, context.previewSize)}
				/>
			);
		},

		ShowAllLink(props) {
			const t = useTranslator();
			const context = useSlotContext("Group");
			const title = props.title ?? context.title;

			return (
				<View as="nav" cn="nav" aria-label={t("aria-label-search-group-nav")}>
					{context.total === context.fetchedHits ? (
						<View
							cn={["group-all-results-shown", "group-header-footer-spacing"]}
						>
							{context.total === 0
								? props.noResults ?? t("no-results")
								: props.allResultsShown ?? t("all-results-shown")}
						</View>
					) : (
						<SingleGroupLink
							total={context.total}
							groupId={context.id}
							groupTitle={title}
							children={props.children}
						/>
					)}
				</View>
			);
		},
	},
	render(props) {
		return (
			<>
				<props.parts.Title />
				<props.parts.Hits />
				<props.parts.ShowAllLink />
			</>
		);
	},
});

function MultiGroupResults() {
	const t = useTranslator();
	const results = useResults();
	const groupOrder = useSearchEngineState().groupOrder;

	function orderGroups(a: GroupResults, b: GroupResults) {
		if (groupOrder === "relevancy") {
			// search results are in relevancy order within groups
			// so we only need to compare first results from each group
			const aScore = a.hits[0]?.score ?? 0;
			const aBoost = a.relevancyBoost;
			const aRelevancy = aScore * aBoost;

			const bScore = b.hits[0]?.score ?? 0;
			const bBoost = b.relevancyBoost;
			const bRelevancy = bScore * bBoost;

			// relevancy should descend
			return bRelevancy - aRelevancy;
		} else if (groupOrder === "static") {
			return 0;
		} else if (typeof groupOrder === "function") {
			return groupOrder(a, b);
		} else {
			// method out of bounds
			const _: never = groupOrder;
			return 0;
		}
	}

	return (
		<>
			{results.sort(orderGroups).map((groupResults) => {
				return (
					<View
						key={groupResults.id}
						cn="group"
						as="section"
						aria-label={t("aria-label-group-hit-total", {
							total: groupResults.total,
						})}
						data-group-id={groupResults.id}
					>
						<GroupSlot
							id={groupResults.id}
							title={groupResults.title}
							total={groupResults.total}
							fetchedHits={groupResults.hits.length}
							hits={groupResults.hits}
							previewSize={groupResults.previewSize}
						/>
					</View>
				);
			})}
		</>
	);
}

const ResultsSlot = createSlotComponent("Results", {
	parts: {
		BackLink(props) {
			return <BackLink children={props.children} />;
		},

		Title(props) {
			const slot = useSlotContext("Results");

			if (slot.groupCount === 1) {
				return null;
			}

			if (!slot.title) {
				return null;
			}

			return (
				<GroupTitle
					title={slot.title}
					total={slot.total}
					children={props.children}
				/>
			);
		},

		Hits() {
			const slot = useSlotContext("Results");

			return <HitList groupId={slot.id} total={slot.total} hits={slot.hits} />;
		},

		Footer(props) {
			const t = useTranslator();
			const slot = useSlotContext("Results");

			const allResultsLoaded = slot.fetchedHits === slot.total;

			return (
				<View as="nav" cn="footer" aria-label={t("load-more")}>
					<FooterContent
						groupId={slot.id}
						total={slot.total}
						allResultsLoaded={allResultsLoaded}
						loadMore={props.loadMore}
						allResultsShown={props.allResultsShown}
						noResults={props.noResults}
					/>
					<View cn="footer-spinner">
						<Spinner spinning={slot.fetchedHits !== 0} />
					</View>
				</View>
			);
		},
	},

	render(props) {
		return (
			<>
				<props.parts.BackLink />
				<props.parts.Title />
				<props.parts.Hits />
				<props.parts.Footer />
			</>
		);
	},
});

function SingleGroupResults(props: { groupId: string; groupIndex: number }) {
	const { focusRef } = useFindkitContext();
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const groupCount = state.usedGroupDefinitions.length;
	const groups = useResults();
	const group = groups[props.groupIndex] ?? groups[0];

	useEffect(() => {
		if (!focusRef.current.groupViewFocusNext) {
			return;
		}

		const focusIndex = group.previewSize;

		const links = engine.container.querySelectorAll("." + cn("hit-title-link"));

		for (const [index, el] of Object.entries(links)) {
			if (focusIndex.toString() === index && el instanceof HTMLAnchorElement) {
				el.focus();
				el.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
				focusRef.current.groupViewFocusNext = false;
				break;
			}
		}
	}, [
		engine,
		props.groupId,
		group.previewSize,
		focusRef,

		// Not used in the effect, but we need to check on every hit change when
		// the focusable index appears in the results.
		group.hits,
	]);

	return (
		<ResultsSlot
			hits={group.hits}
			groupCount={groupCount}
			id={props.groupId}
			total={group.total}
			fetchedHits={group.hits.length}
			title={group?.title}
		/>
	);
}

/**
 * Search footer in the single group view.
 */
function FooterContent(props: {
	allResultsLoaded: boolean;
	total: number;
	groupId: string;
	allResultsShown: any;
	loadMore: any;
	noResults: any;
}) {
	const state = useSearchEngineState();
	const t = useTranslator();
	const engine = useSearchEngine();
	const kbAttrs = useKeyboardItemAttributes("load-more-" + props.groupId);
	const firstSearchMade = state.usedTerms !== undefined;

	if (!firstSearchMade) {
		return null;
	}

	if (props.total === 0) {
		return (
			<View cn="all-results-shown">{props.noResults ?? t("no-results")}</View>
		);
	}

	if (props.allResultsLoaded) {
		return (
			<View cn="all-results-shown">
				{props.allResultsShown ?? t("all-results-shown")}
			</View>
		);
	}

	return (
		<View
			as="button"
			cn="load-more-button"
			type="button"
			{...kbAttrs}
			disabled={state.status === "fetching"}
			onClick={() => {
				engine.searchMore({ now: true });
			}}
		>
			{props.loadMore ?? t("load-more")}
			<View cn="hover-bg" />
		</View>
	);
}

export function ResultsContent() {
	const t = useTranslator();
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const view = useView();
	const groupCount = state.usedGroupDefinitions.length;
	const labelId = engine.getUniqId("results-heading");

	let label;

	if (groupCount === 1) {
		label = t("single-search-results-heading");
	} else {
		label =
			view === "groups"
				? t("aria-live-group-navigation-search-multiple-groups", { groupCount })
				: t("aria-live-group-navigation-search-selected-group");
	}

	return (
		<>
			<View as="section" aria-labelledby={labelId} cn="content">
				<View
					as="h1"
					id={labelId}
					cn="sr-only"
					// Announce groups heading only when there are more than one group
					// to have then announced when the user navigates to a group or back.
					// With single group there is no navigating and no need to announce it.
					aria-live={groupCount > 1 ? "polite" : "off"}
				>
					{label}
				</View>

				<FetchError />
				<SlotCatchBoundary name="Content" props={{}}>
					{state.messages.length > 0 && (
						<section aria-label={t("aria-label-findkit-messages")}>
							{state.messages.map((m) => (
								<View
									cn="message"
									key={m.id}
									dangerouslySetInnerHTML={{ __html: m.message }}
								/>
							))}
						</section>
					)}
					<SingleOrGroupResults />
				</SlotCatchBoundary>

				{Boolean(
					state.canAnnounceResults && state.announceResultsMessage.text,
				) ? (
					<View
						key={state.announceResultsMessage.key}
						cn={["sr-only", "results-aria-live-message"]}
						aria-live="assertive"
					>
						{state.announceResultsMessage.text}
					</View>
				) : null}
			</View>
		</>
	);
}

function FetchError() {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const t = useTranslator();

	if (!state.error) {
		return null;
	}

	return (
		<ErrorContainer title={t("error-title")} error={state.error?.message ?? ""}>
			<View
				as="button"
				cn="retry-button"
				type="button"
				onClick={() => engine.retry()}
			>
				{t("try-again")}
			</View>
		</ErrorContainer>
	);
}

function SingleOrGroupResults() {
	const state = useSearchEngineState();

	if (
		state.usedGroupDefinitions.length === 1 &&
		state.usedGroupDefinitions[0]
	) {
		// Only single group defined so the view is always single
		return (
			<SingleGroupResults
				groupIndex={0}
				groupId={state.usedGroupDefinitions[0].id}
			/>
		);
	} else if (state.currentGroupId === undefined) {
		// There's multiple groups but no group is selected, must show the groups view
		return <MultiGroupResults />;
	}

	// Multiple groups with a selected group. Show the single view (for that group)
	const index = state.usedGroupDefinitions.findIndex(
		(group) => group.id === state.currentGroupId,
	);

	return (
		<SingleGroupResults groupIndex={index} groupId={state.currentGroupId} />
	);
}

export function Logo() {
	return (
		<svg
			className={cn("magnifying-glass")}
			xmlns="http://www.w3.org/2000/svg"
			width={24}
			height={24}
			viewBox="0 0 24 20"
		>
			<path
				fill="currentColor"
				d="M14.303 8.65c-.027 3.444-2.696 6.209-5.958 6.18-3.263.034-5.932-2.736-5.965-6.18.033-3.442 2.702-6.207 5.965-6.178 3.262-.03 5.931 2.741 5.958 6.179zm4.243 10.537a1.906 1.906 0 0 0-.032-2.592l-3.154-3.277a8.82 8.82 0 0 0 1.33-4.656C16.69 3.88 12.951 0 8.344 0 3.736 0 0 3.886 0 8.662c0 4.777 3.736 8.657 8.345 8.657a8.13 8.13 0 0 0 4.488-1.38l3.153 3.277a1.751 1.751 0 0 0 2.528 0c.01-.012.022-.018.032-.029z"
			/>
			<path
				className={cn("magnifying-glass-lightning")}
				fill="currentColor"
				d="M21.602 11.719V8.45l-2.852 4.198h1.623c.058 0 .106.051.106.114v3.275l2.852-4.198h-1.623c-.058 0-.106-.051-.106-.115"
			/>
		</svg>
	);
}

export function Arrow(props: { direction: "left" | "right" }) {
	const transform = "";
	return (
		<View
			as="svg"
			stroke="currentColor"
			fill="currentColor"
			strokeWidth={0}
			viewBox="2 2 20 20"
			height={24}
			width={24}
			xmlns="http://www.w3.org/2000/svg"
			style={{
				transform:
					(props.direction === "right" ? "rotate(180deg) " : "") + transform,
			}}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M13.362 17.0002C13.0898 16.9991 12.8298 16.8872 12.642 16.6902L8.78195 12.6902H8.78195C8.40081 12.3013 8.40081 11.679 8.78195 11.2902L12.782 7.29019C13.1741 6.89806 13.8098 6.89806 14.202 7.29019C14.5941 7.68231 14.5941 8.31807 14.202 8.71019L10.902 12.0002L14.082 15.3002C14.4697 15.6902 14.4697 16.3201 14.082 16.7102C13.8908 16.8999 13.6312 17.0044 13.362 17.0002Z"
			/>
		</View>
	);
}

export function Spinner(props: { spinning?: boolean }) {
	const state = useSearchEngineState();
	return (
		<View
			aria-hidden
			cn={{
				spinner: true,
				spinning: props.spinning !== false && state.loading,
			}}
		></View>
	);
}

export function ErrorContainer(props: {
	title: ReactNode;
	children: ReactNode;
	props?: any;
	error: string | null;
}) {
	const engine = useSearchEngine();
	const labelId = engine.getUniqId("error");

	let propsString = null;
	try {
		propsString = JSON.stringify(props.props, null, 2);
	} catch {}

	return (
		<View as="section" cn="error" arial-aria-labelledby={labelId}>
			<View as="h2" cn="error-title" id={labelId}>
				{props.title}
			</View>

			{props.children ? <View cn="error-details">{props.children}</View> : null}

			<View as="pre" cn="error-message">
				{props.error}
			</View>

			{propsString && propsString !== "{}" && !isProd() ? (
				<View as="pre" cn="error-props">
					{propsString}
				</View>
			) : null}
		</View>
	);
}
