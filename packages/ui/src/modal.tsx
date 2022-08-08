import { FocusTrap } from "./focus-trap";
import React, { StrictMode, useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Results, FindkitProvider } from "./components";
import {
    useSearchEngineState,
    useSearchEngine,
    useInput,
    Slots,
} from "./core-hooks";

import { SearchEngine, GroupDefinition } from "./search-engine";
import { View } from "./utils";

function useScrollLock(lock: boolean) {
    useEffect(() => {
        if (!lock) {
            return;
        }

        const origHeight = window.document.documentElement.style.height;
        const origOverflow = window.document.documentElement.style.overflow;

        window.document.documentElement.style.height = "100%;";
        window.document.documentElement.style.overflow = "hidden";

        return () => {
            window.document.documentElement.style.height = origHeight;
            window.document.documentElement.style.overflow = origOverflow;
        };
    }, [lock]);
}

function useFocusTrap() {
    const state = useSearchEngineState();
    const engine = useSearchEngine();
    const isOpen = state.status !== "closed";
    const containerRef = useRef<HTMLDivElement | null>(null);
    const trapRef = useRef<FocusTrap | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (!trapRef.current && containerRef.current) {
            trapRef.current = new FocusTrap({
                containers: [containerRef.current],
                escDisables: true,
                outsideClickDisables: true,
                onAfterEnable() {
                    containerRef.current?.querySelector("input")?.focus();
                },
                onAfterDisable() {
                    if (trapRef.current) {
                        engine.close();
                    }
                },
            });
            trapRef.current.enable();
        }

        return () => {
            const trap = trapRef.current;
            trapRef.current = null;
            trap?.disable();
        };
    }, [engine, isOpen]);

    return containerRef;
}

function useDelay(show: boolean, ms: number) {
    const [status, setStatus] = useState(false);

    useEffect(() => {
        if (show) {
            setStatus(show);
        } else {
            const timer = setTimeout(() => {
                setStatus(false);
            }, ms);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [ms, show]);

    return status;
}

function ModalResult() {
    const engine = useSearchEngine();
    const state = useSearchEngineState();
    const inputRef = useInput();
    const containerRef = useFocusTrap();

    const show = state.status !== "closed";
    const duration = 150;
    const delayed = useDelay(show, duration);
    const unmount = !delayed && !show;

    useScrollLock(!unmount);

    if (unmount) {
        return null;
    }

    const visible = show && delayed;

    return (
        <View
            ref={containerRef}
            cn={["modal", visible && "modal-visible"]}
            style={{
                ["--findkit--modal-animation-duration"]: `${duration}ms`,
            }}
        >
            <View cn="header">
                <View
                    cn="close-button"
                    as="button"
                    type="button"
                    onClick={() => {
                        engine.close();
                    }}
                >
                    x
                </View>
                <View as="input" cn="search-input" type="text" ref={inputRef} />
            </View>

            <Results />
        </View>
    );
}
export function Modal(props: {
    projectId?: string;
    engine?: SearchEngine;
    groups: GroupDefinition[];
    slots?: Partial<Slots>;
}) {
    return (
        <FindkitProvider
            projectId={props.projectId}
            slots={props.slots}
            groups={props.groups}
            engine={props.engine}
        >
            <ModalResult />
        </FindkitProvider>
    );
}

function createContainer(options: { shadowDom?: boolean }) {
    const container = document.createElement("div");
    container.id = "findkit-container";
    document.body.appendChild(container);

    if (options.shadowDom) {
        container.id = "findkit-shadow";
        return container.attachShadow({ mode: "open" });
    }

    return container;
}

/**
 * @public
 */
export function initModal(options: {
    projectId: string;
    instanceId?: string;
    shadowDom?: boolean;
    css?: string;
    styleSheets: string[];
    groups: GroupDefinition[];
    slots?: Partial<Slots>;
}) {
    const container = createContainer({ shadowDom: options.shadowDom });

    const engine = new SearchEngine({
        projectId: options.projectId,
        instanceId: options.instanceId,
    });

    const elements = (
        <StrictMode>
            <>
                {options.styleSheets.map((href) => (
                    <link key={href} rel="stylesheet" href={href} />
                ))}
                {options.css ? (
                    <style dangerouslySetInnerHTML={{ __html: options.css }} />
                ) : null}

                <Modal {...options} engine={engine} />
            </>
        </StrictMode>
    );

    ReactDOM.render(elements, container);
    return engine;
}
