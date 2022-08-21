import React, {
	ComponentProps,
	MouseEventHandler,
	ReactNode,
	useMemo,
} from "react";
import {
	FindkitContext,
	FindkitContextType,
	Slots,
	useSearchEngine,
	useFindkitURLSearchParams,
	useSearchEngineState,
	useFindkitContext,
} from "./core-hooks";
import { SearchEngine, SearchResultHit } from "./search-engine";
import { cn, View } from "./utils";

export function FindkitProvider(props: {
	children: ReactNode;
	engine: SearchEngine;
	slots?: Partial<Slots>;
}) {
	const context = useMemo(() => {
		const value: FindkitContextType = {
			engine: props.engine,
			translations: {} as any,
			slots: props.slots ?? {},
		};

		return value;
	}, [props.engine, props.slots]);

	return (
		<FindkitContext.Provider value={context}>
			{props.children}
		</FindkitContext.Provider>
	);
}

function Slot<Name extends keyof Slots>(props: {
	name: Name;
	props: ComponentProps<Slots[Name]>;
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

	return (
		<View
			as="a"
			cn="more-link"
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
	const engine = useSearchEngine();
	const params = useFindkitURLSearchParams();
	const nextParams = params.clearGroupId();

	return (
		<View
			as="a"
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

function HitList(props: {
	title: string;
	hits: ReadonlyArray<SearchResultHit>;
}) {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	const multipleGroups = state.groupDefinitions.length > 1;

	return (
		<>
			{props.title && multipleGroups ? (
				<View as="h1" cn="group-title">
					{props.title}
				</View>
			) : null}

			{props.hits.map((hit) => {
				const handleLinkClick: MouseEventHandler<HTMLDivElement> = (e) => {
					if (!(e.target instanceof HTMLAnchorElement)) {
						return;
					}

					if (e.target.href !== hit.url) {
						return;
					}

					engine.events.emit("hit-click", {
						hit,
						target: e.target,
						terms: engine.state.terms,
						preventDefault: () => {
							e.preventDefault();
						},
					});
				};

				return (
					<View key={hit.url} cn="hit" onClick={handleLinkClick}>
						<Slot
							name="Hit"
							key={hit.url}
							props={{
								hit: hit,
							}}
						>
							<a href={hit.url}>{hit.title}</a>
						</Slot>
					</View>
				);
			})}
		</>
	);
}

function AllGroupResults() {
	const state = useSearchEngineState();

	return (
		<div>
			{state.groupDefinitions.map((def) => {
				let group = state.resultGroups[def.id];
				if (!group) {
					group = {
						hits: [],
						total: 0,
						duration: 0,
					};
				}

				return (
					<div key={def.id}>
						<HitList
							title={def.title}
							hits={group.hits.slice(0, def.previewSize)}
						/>
						<p>total: {group.total}</p>
						<SingleGroupLink groupId={def.id}>Show all</SingleGroupLink>
					</div>
				);
			})}
		</div>
	);
}

function SingleGroupResults(props: { groupId: string }) {
	const state = useSearchEngineState();
	const engine = useSearchEngine();
	let group = state.resultGroups[props.groupId];

	const groupCount = state.groupDefinitions.length;
	const title = state.groupDefinitions.find((group) => {
		return group.id === props.groupId;
	})?.title;

	if (!group) {
		group = {
			hits: [],
			total: 0,
			duration: 0,
		};
	}

	return (
		<div>
			<HitList title={title ?? ""} hits={group.hits} />

			<p>total: {group.total}</p>
			{groupCount > 1 && <AllResultsLink>go back</AllResultsLink>}

			<p>
				<View
					as="button"
					cn="load-more-button"
					type="button"
					disabled={group.hits.length === group.total}
					onClick={() => {
						engine.searchMore();
					}}
				>
					load more
				</View>
			</p>
		</div>
	);
}

export function Results() {
	const state = useSearchEngineState();

	if (state.groupDefinitions.length === 1 && state.groupDefinitions[0]) {
		return <SingleGroupResults groupId={state.groupDefinitions[0].id} />;
	} else if (state.currentGroupId === undefined) {
		return <AllGroupResults />;
	}

	return <SingleGroupResults groupId={state.currentGroupId} />;
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
