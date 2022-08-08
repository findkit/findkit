import React, {
    ComponentProps,
    ReactNode,
    useEffect,
    useMemo,
    useState,
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
import {
    GroupDefinition,
    SearchEngine,
    SearchResultHit,
} from "./search-engine";
import { View } from "./utils";

export function FindkitProvider(props: {
    projectId?: string;
    groups: GroupDefinition[];
    children: ReactNode;
    engine?: SearchEngine;
    slots?: Partial<Slots>;
    shadowRoot?: ShadowRoot;
}) {
    const [engine, setEngine] = useState<SearchEngine | undefined>(
        props.engine || undefined,
    );

    useEffect(() => {
        if (props.engine) {
            return;
        }

        let oldEngine: SearchEngine | undefined = undefined;

        if (!engine || engine.projectId !== props.projectId) {
            if (!props.projectId) {
                throw new Error("No project id provided to FindkitProvider!");
            }

            const nextEngine = new SearchEngine({
                projectId: props.projectId,
            });
            oldEngine = engine;
            setEngine(nextEngine);
        }

        return () => {
            oldEngine?.dispose();
        };
    }, [engine, props.engine, props.projectId]);

    useEffect(() => {
        engine?.setGroups(props.groups);
    }, [engine, props.groups]);

    const context = useMemo(() => {
        const value: FindkitContextType = {
            engine,
            translations: {} as any,
            slots: props.slots ?? {},
        };

        return value;
    }, [engine, props.slots]);

    if (!context.engine) {
        return null;
    }

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
    return (
        <>
            <View as="h1" cn="group-title">
                {props.title}
            </View>

            {props.hits.map((hit) => {
                return (
                    <Slot
                        name="Hit"
                        key={hit.url}
                        props={{
                            hit: hit,
                        }}
                    >
                        <View key={hit.url} cn="hit">
                            <a href={hit.url}>{hit.title}</a>
                        </View>
                    </Slot>
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
                        <SingleGroupLink groupId={def.id}>
                            Show all
                        </SingleGroupLink>
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

    let results;

    if (state.groupDefinitions.length === 1 && state.groupDefinitions[0]) {
        results = <SingleGroupResults groupId={state.groupDefinitions[0].id} />;
    } else if (state.currentGroupId === undefined) {
        results = <AllGroupResults />;
    } else {
        results = <SingleGroupResults groupId={state.currentGroupId} />;
    }

    return (
        <div>
            <View
                cn="loading"
                style={{
                    visibility:
                        state.status === "fetching" ? "visible" : "hidden",
                }}
            >
                Loading...
            </View>

            {results}
        </div>
    );
}
