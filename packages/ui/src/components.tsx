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
	Slots,
	useSearchEngine,
	useFindkitURLSearchParams,
	useSearchEngineState,
	useFindkitContext,
	SlotProps,
	useTranslator,
	useKeyboardItemAttributes,
} from "./core-hooks";
import { SearchEngine, SearchResultHit } from "./search-engine";
import { createTranslator } from "./translations";
import { cn, View } from "./utils";

export function FindkitProvider(props: {
	children: ReactNode;
	engine: SearchEngine;
	slots?: Partial<Slots>;
}) {
	const state = useSnapshot(props.engine.state);
	const strings = state.ui.strings[state.ui.lang];

	const context = useMemo(() => {
		const value: FindkitContextType = {
			engine: props.engine,
			translator: createTranslator(state.ui.lang, strings),
			slots: props.slots ?? {},
		};

		return value;
	}, [props.engine, props.slots, state.ui.lang, strings]);

	return (
		<FindkitContext.Provider value={context}>
			{props.children}
		</FindkitContext.Provider>
	);
}

export function Slot<Name extends keyof SlotProps>(props: {
	name: Name;
	props: SlotProps[Name];
	children: ReactNode;
}) {
	const context = useFindkitContext();

	const SlotComponent = context.slots[props.name] as any;

	if (!SlotComponent) {
		return <>{props.children}</>;
	}

	return <SlotComponent {...props.props}>{props.children}</SlotComponent>;
}

function SingleGroupLink(props: { children: ReactNode; groupId: string }) {
	const engine = useSearchEngine();
	const params = useFindkitURLSearchParams();
	const nextParams = params.setGroupId(props.groupId);
	const kbAttrs = useKeyboardItemAttributes(
		"single-group-link-" + props.groupId,
	);

	return (
		<View
			as="a"
			cn="more-link"
			{...kbAttrs}
			data-kb-action
			href={nextParams.toLink()}
			onClick={(e: { preventDefault: () => void }) => {
				e.preventDefault();
				engine.updateAddressBar(nextParams, { push: true });
			}}
		>
			{props.children}
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
			cn="back-link"
			href={nextParams.toLink()}
			onClick={(e: { preventDefault: () => void }) => {
				e.preventDefault();
				engine.updateAddressBar(nextParams, { push: true });
			}}
		>
			{props.children}
		</View>
	);
}

function GroupTitle(props: { title: string; total: number }) {
	return (
		<View as="h1" cn="group-title">
			{props.title} {props.total > 0 ? `(${props.total})` : ""}
		</View>
	);
}

function Hit(props: {
	hit: SearchResultHit;
	groupId: string;
	groupIndex: number;
	hitIndex: number;
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
			terms: engine.state.usedTerms,
			preventDefault: () => {
				e.preventDefault();
			},
		});
	};

	return (
		<View key={props.hit.url} cn="hit" {...kbAttrs} onClick={handleLinkClick}>
			<Slot
				name="Hit"
				key={props.hit.url}
				props={{
					hit: props.hit,
				}}
			>
				<a href={props.hit.url} data-kb-action>
					{props.hit.title}
				</a>
				<span>{props.hit.url}</span>
			</Slot>
		</View>
	);
}

function HitList(props: {
	groupId: string;
	groupIndex: number;
	hits: ReadonlyArray<SearchResultHit>;
}) {
	return (
		<>
			{props.hits.map((hit, index) => {
				return (
					<Hit
						key={hit.url}
						hit={hit}
						hitIndex={index}
						groupId={props.groupId}
						groupIndex={props.groupIndex}
					/>
				);
			})}
		</>
	);
}

function MultiGroupResults() {
	const state = useSearchEngineState();
	const t = useTranslator();

	return (
		<>
			{state.usedGroupDefinitions.map((def, groupIndex) => {
				let group = state.resultGroups[def.id];
				if (!group) {
					group = {
						hits: [],
						total: 0,
						duration: 0,
					};
				}

				return (
					<View key={def.id} cn="group">
						{def.title ? (
							<GroupTitle title={def.title} total={group.total} />
						) : null}
						<HitList
							groupId={def.id}
							groupIndex={groupIndex}
							hits={group.hits.slice(0, def.previewSize)}
						/>
						<p>
							{t("total")}: {group.total}
						</p>
						<SingleGroupLink groupId={def.id}>{t("show-all")}</SingleGroupLink>
					</View>
				);
			})}
		</>
	);
}

function SingleGroupResults(props: { groupId: string; groupIndex: number }) {
	const state = useSearchEngineState();
	const t = useTranslator();
	const engine = useSearchEngine();
	const groupCount = state.usedGroupDefinitions.length;
	let group = state.resultGroups[props.groupId];
	const kbAttrs = useKeyboardItemAttributes("load-more-" + props.groupId);

	const ref = useRef<HTMLButtonElement | null>(null);

	if (!group) {
		group = {
			hits: [],
			total: 0,
			duration: 0,
		};
	}

	useEffect(() => {
		if (!state.infiniteScroll || state.keyboardCursor) {
			return;
		}

		const el = ref.current;

		if (!el) {
			return;
		}

		const observer = new IntersectionObserver(
			() => {
				engine.searchMore();
			},
			{
				threshold: 0.5,
			},
		);

		observer.observe(el);

		return () => {
			observer.unobserve(el);
		};
	}, [engine, state.infiniteScroll, state.keyboardCursor]);

	return (
		<>
			{groupCount > 1 && <AllResultsLink>Go back</AllResultsLink>}

			<HitList
				groupIndex={props.groupIndex}
				groupId={props.groupId}
				hits={group.hits}
			/>

			<p>total: {group.total}</p>

			<p>
				<View
					as="button"
					cn="load-more-button"
					ref={ref}
					type="button"
					{...kbAttrs}
					disabled={
						group.hits.length === group.total || state.status === "fetching"
					}
					onClick={() => {
						engine.searchMore({ force: true });
					}}
				>
					{t("load-more")}
				</View>
			</p>
		</>
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
				"logo-animating": state.status === "fetching",
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
