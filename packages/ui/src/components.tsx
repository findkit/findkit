import React, {
	MouseEventHandler,
	ReactNode,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { useSnapshot } from "valtio";
import {
	FindkitContext,
	FindkitContextType,
	useSearchEngine,
	useFindkitURLSearchParams,
	useSearchEngineState,
	useTranslator,
	useKeyboardItemAttributes,
	useSearchMoreOnReveal,
	FocusRef,
	useFindkitContext,
} from "./core-hooks";
import {
	DEFAULT_PREVIEW_SIZE,
	SearchEngine,
	SearchResultHit,
	SortGroup,
} from "./search-engine";
import { Slot, Slots } from "./slots";
import { createTranslator } from "./translations";
import { cn, scrollToTop, View } from "./utils";

export function FindkitProvider(props: {
	children: ReactNode;
	engine: SearchEngine;
	slots?: Partial<Slots>;
}) {
	const state = useSnapshot(props.engine.state);
	const strings = state.ui.strings[state.ui.lang];
	const focusRef = useRef<FocusRef>({});

	const context = useMemo(() => {
		const value: FindkitContextType = {
			engine: props.engine,
			translator: createTranslator(state.ui.lang, strings),
			slots: props.slots ?? {},
			focusRef,
		};

		return value;
	}, [props.engine, props.slots, state.ui.lang, strings]);

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
}) {
	const t = useTranslator();
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
			cn={["single-group-link", "hover-bg", "group-header-footer-spacing"]}
			{...kbAttrs}
			data-kb-action
			aria-label={t("aria-show-all", { group: props.groupTitle })}
			href={engine.formatHref(nextParams)}
			onClick={(e) => {
				e.preventDefault();
				if (!(e.target instanceof HTMLElement)) {
					return;
				}

				if (engine.elementHost.activeElement === e.target) {
					focusRef.current.groupViewFocusNext = true;
				}

				scrollToTop(e.target);
				engine.updateAddressBar(nextParams, { push: true });
			}}
		>
			<View cn="link-text">{props.children}</View>
			<Arrow direction="right" />
		</View>
	);
}

function AllResultsLink(props: { children: ReactNode }) {
	const kbAttrs = useKeyboardItemAttributes("back-to-all-results");
	const engine = useSearchEngine();
	const params = useFindkitURLSearchParams();
	const nextParams = params.clearGroupId();

	return (
		<View
			as="a"
			{...kbAttrs}
			data-kb-action
			cn={["back-link", "hover-bg", "group-header-footer-spacing"]}
			href={engine.formatHref(nextParams)}
			onClick={(e) => {
				e.preventDefault();
				engine.updateAddressBar(nextParams, { push: true });
			}}
		>
			<Arrow direction="left" />
			<View cn="link-text">{props.children}</View>
		</View>
	);
}

function GroupTitle(props: { title: string; total: number }) {
	return (
		<View as="h2" cn="group-title" aria-label={props.title}>
			{props.title} {props.total > 0 ? `(${props.total})` : ""}
		</View>
	);
}

function Hit(props: {
	hit: SearchResultHit;
	groupId: string;
	hitIndex: number;
	containerRef: ReturnType<typeof useSearchMoreOnReveal> | undefined;
}) {
	const engine = useSearchEngine();
	const kbAttrs = useKeyboardItemAttributes(
		`hit-${props.groupId}-${props.hitIndex}`,
	);

	const handleLinkClick: MouseEventHandler<HTMLDivElement> = (e) => {
		if (!(e.target instanceof HTMLAnchorElement)) {
			return;
		}

		if (e.target.href !== props.hit.url) {
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
			ref={props.containerRef}
			key={props.hit.url}
			cn="hit"
			{...kbAttrs}
			onClick={handleLinkClick}
		>
			<Slot
				name="Hit"
				key={props.hit.url}
				props={{
					hit: props.hit,
				}}
			>
				<View as="h3" cn="hit-title">
					<View
						as="a"
						cn={["hit-title-link", "link"]}
						href={props.hit.url}
						data-kb-action
					>
						{props.hit.title}
					</View>
				</View>

				<View
					cn="highlight"
					dangerouslySetInnerHTML={{ __html: props.hit.highlight }}
				></View>

				<View
					as="a"
					cn={["hit-url", "link"]}
					href={props.hit.url}
					tabIndex={-1}
				>
					{props.hit.url}
				</View>
			</Slot>
		</View>
	);
}

function HitList(props: {
	groupId: string;

	title?: string;
	total: number;
	hits: ReadonlyArray<SearchResultHit>;
}) {
	const hitRef = useSearchMoreOnReveal();

	return (
		<>
			{props.title ? (
				<GroupTitle title={props.title} total={props.total} />
			) : null}

			{props.hits.map((hit, index) => {
				const last = index === props.hits.length - 1;
				return (
					<Hit
						key={hit.url}
						hit={hit}
						hitIndex={index}
						groupId={props.groupId}
						containerRef={last ? hitRef : undefined}
					/>
				);
			})}
		</>
	);
}

function MultiGroupResults() {
	const state = useSearchEngineState();
	const t = useTranslator();
	const groupOrder = state.groupOrder;

	function orderGroups(a: SortGroup, b: SortGroup) {
		if (groupOrder === "relevancy") {
			// search results are in relevancy order within groups
			// so we only need to compare first results from each group
			const aScore = a.results.hits[0]?.score ?? 0;
			const aBoost = a.groupDefinition?.scoreBoost ?? 0;
			const aRelevancy = aScore * aBoost;

			const bScore = b.results.hits[0]?.score ?? 0;
			const bBoost = b.groupDefinition?.scoreBoost ?? 0;
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
			{state.usedGroupDefinitions
				.map((def) => {
					let group = state.resultGroups[def.id];
					if (!group) {
						group = {
							hits: [],
							total: 0,
							duration: 0,
						};
					}
					return {
						results: group,
						groupDefinition: def,
					};
				})
				.sort(orderGroups)
				.map((sortGroup) => {
					return (
						<View
							key={sortGroup.groupDefinition.id}
							cn="group"
							data-group-id={sortGroup.groupDefinition.id}
						>
							<HitList
								groupId={sortGroup.groupDefinition.id}
								title={sortGroup.groupDefinition.title}
								total={sortGroup.results.total}
								hits={sortGroup.results.hits.slice(
									0,
									sortGroup.groupDefinition.previewSize,
								)}
							/>

							{sortGroup.results.total === sortGroup.results.hits.length ? (
								<View
									cn={[
										"group-all-results-shown",
										"group-header-footer-spacing",
									]}
								>
									{sortGroup.results.total === 0
										? t("no-results")
										: t("all-results-shown")}
								</View>
							) : (
								<SingleGroupLink
									groupId={sortGroup.groupDefinition.id}
									groupTitle={sortGroup.groupDefinition.title}
								>
									{t("show-all")}
								</SingleGroupLink>
							)}
						</View>
					);
				})}
		</>
	);
}

function SingleGroupResults(props: { groupId: string; groupIndex: number }) {
	const { focusRef } = useFindkitContext();
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const t = useTranslator();
	const groupCount = state.usedGroupDefinitions.length;
	let group = state.resultGroups[props.groupId];
	const def = state.usedGroupDefinitions[props.groupIndex];

	if (!group) {
		group = {
			hits: [],
			total: 0,
			duration: 0,
		};
	}

	const allResultsLoaded = group.hits.length === group.total;

	useEffect(() => {
		if (!focusRef.current.groupViewFocusNext) {
			return;
		}

		const focusIndex = def?.previewSize ?? DEFAULT_PREVIEW_SIZE;

		const links = engine.container.querySelectorAll("." + cn("hit-title-link"));

		for (const [index, el] of Object.entries(links)) {
			if (focusIndex.toString() === index && el instanceof HTMLAnchorElement) {
				el.focus();
				focusRef.current.groupViewFocusNext = false;
				break;
			}
		}
	}, [
		engine,
		props.groupId,
		focusRef,
		def,

		// Not used in the effect but we need to check on every hit change when
		// the focusable index appears in the results.
		group.hits,
	]);

	return (
		<>
			{groupCount > 1 && <AllResultsLink>{t("go-back")}</AllResultsLink>}

			<HitList
				groupId={props.groupId}
				hits={group.hits}
				total={group.total}
				title={groupCount > 1 ? def?.title : undefined}
			/>

			<View cn="footer">
				<FooterContent
					groupId={props.groupId}
					allResultsLoaded={allResultsLoaded}
				/>
				<View cn="footer-spinner">
					<Spinner spinning={group.hits.length !== 0} />
				</View>
			</View>
		</>
	);
}

function FooterContent(props: { allResultsLoaded: boolean; groupId: string }) {
	const state = useSearchEngineState();
	const t = useTranslator();
	const engine = useSearchEngine();
	const kbAttrs = useKeyboardItemAttributes("load-more-" + props.groupId);
	const firstSearchMade = state.usedTerms !== undefined;

	if (!firstSearchMade) {
		return null;
	}

	if (props.allResultsLoaded) {
		return <View cn="all-results-shown">{t("all-results-shown")}</View>;
	}

	return (
		<View
			as="button"
			cn={["load-more-button", "hover-bg"]}
			type="button"
			{...kbAttrs}
			disabled={state.status === "fetching"}
			onClick={() => {
				engine.searchMore({ now: true });
			}}
		>
			{t("load-more")}
		</View>
	);
}

export function Results() {
	const state = useSearchEngineState();

	if (
		state.usedGroupDefinitions.length === 1 &&
		state.usedGroupDefinitions[0]
	) {
		return (
			<SingleGroupResults
				groupIndex={0}
				groupId={state.usedGroupDefinitions[0].id}
			/>
		);
	} else if (state.currentGroupId === undefined) {
		return <MultiGroupResults />;
	}

	const index = state.usedGroupDefinitions.findIndex(
		(group) => group.id === state.currentGroupId,
	);

	return (
		<SingleGroupResults groupIndex={index} groupId={state.currentGroupId} />
	);
}

export function Logo() {
	const state = useSearchEngineState();
	return (
		<svg
			className={cn({
				logo: true,
				"logo-hide": state.status === "fetching",
			})}
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
			cn={{
				spinner: true,
				spinning: props.spinning !== false && state.status === "fetching",
			}}
		></View>
	);
}
