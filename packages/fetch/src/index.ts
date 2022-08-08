/**
 * @public
 */
export interface FindKitDeveloperOptions {
    staging?: boolean;
    logResponseTimes?: boolean;
}

/**
 * @public
 */
export type CustomFields = {
    [customField: string]:
        | { type: "date"; value: string }
        | { type: "keyword"; value: string }
        | { type: "number"; value: number }
        | undefined;
};

/**
 * @public
 */
interface JwtToken {
    jwt: string;
}

/**
 * @public
 */
export interface FindkitFetchOptions
    extends FindkitSearchParams,
        FindKitDeveloperOptions {
    projectId?: string;
    searchEndpoint?: string;
}

/**
 * @public
 */
export interface FindkitFetch {
    (options: FindkitFetchOptions): Promise<FindkitSearchResponse>;
}

/**
 * @public
 */
export interface JwtErrorResponse {
    error: {
        type?: "jwt-expired" | "jwt-invalid";
    };
}

/**
 * @public
 */
export interface GetJwtToken {
    (): Promise<JwtToken>;
}

/**
 * @public
 */
export interface PostRequestInit {
    method: "POST";
    mode: "cors";
    credentials: "omit";
    headers: { [k: string]: string };
    body: string;
}

/**
 * @public
 */
export function createFindkitFetcher(props?: { getJwtToken?: GetJwtToken }) {
    let currentJwtTokenPromise: Promise<JwtToken> | null = null;

    /**
     * For internal tests only
     */
    function clear() {
        currentJwtTokenPromise = null;
    }

    function refresh() {
        if (typeof props?.getJwtToken === "function") {
            currentJwtTokenPromise = props.getJwtToken();
        }
    }

    const findkitFetch: FindkitFetch = (options: FindkitFetchOptions) => {
        // new implementation
        const fetchUrl = getSearchEndpoint(options);
        const started = Date.now();
        const requestBody = getRequestBody(options);

        if (!currentJwtTokenPromise) {
            refresh();
        }

        return Promise.resolve(currentJwtTokenPromise).then((token) => {
            const fetchOptions: PostRequestInit = {
                method: "POST",
                mode: "cors",
                credentials: "omit",
                headers: {
                    // This looks wrong but is intentional. We want to make "Simple CORS
                    // requests" eg. requests without the OPTIONS preflight and
                    // application/json is not allowed for those. So we just have to use
                    // one of the allowed ones.
                    // See https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
                    "Content-Type": "text/plain",
                },
                body: JSON.stringify(requestBody),
            };

            if (token && fetchOptions.headers) {
                fetchOptions.headers["authorization"] = "Bearer " + token.jwt;
            }

            return fetch(fetchUrl, fetchOptions).then((res) => {
                if (res.status === 403) {
                    return res.json().then((error: JwtErrorResponse) => {
                        if (error.error.type === "jwt-expired") {
                            // Generate new promise of the new token and retry the fetchh
                            refresh();
                            return findkitFetch(options);
                        }

                        throw new Error(
                            "[findkit] Permission denied: " + error.error.type,
                        );
                    });
                }

                if (!res.ok) {
                    throw new Error(
                        "[findkit] Bad response from search: " + res.status,
                    );
                }

                const searchResponses =
                    res.json() as Promise<FindkitSearchResponse>;

                return searchResponses.then((resolvedJson) => {
                    if (options.logResponseTimes) {
                        const total = Date.now() - started;
                        const backendDuration =
                            Number(
                                res.headers.get("x-findkit-search-duration"),
                            ) || 0;

                        console.log(
                            `[findkit] Response total ${total}ms, backend ${backendDuration}ms, network ${
                                total - backendDuration
                            }ms`,
                        );

                        options.groups.forEach((group, index) => {
                            const duration =
                                resolvedJson.groups[index]?.duration ?? 0;
                            console.log(
                                `[findkit] Group response ${duration}ms for group "${index}"`,
                                group,
                            );
                        });
                    }

                    return resolvedJson;
                });
            });
        });
    };

    return {
        findkitFetch,
        clear,
        refresh,
    };
}

export function getRequestBody(
    options: FindkitFetchOptions,
): FindkitSearchParams {
    return {
        q: options.q,
        groups: options.groups,
    };
}

function getSearchEndpoint(options: FindkitFetchOptions) {
    if (options.searchEndpoint) {
        return options.searchEndpoint;
    } else if (options.projectId) {
        return getProjectSearchEndpoint(options.projectId);
    } else {
        throw new Error("Unable to determine search endpoint");
    }
}

export function getProjectSearchEndpoint(projectId: string) {
    return `https://search.findkit.com/c/${projectId}/search?p=${projectId}`;
}

/**
 * @public
 */
export const findkitFetch: FindkitFetch = createFindkitFetcher().findkitFetch;

/**
 * @public
 */
export interface FindkitSearchParams {
    q: string;
    groups: FindkitSearchGroupParams[];
}

/**
 * @public
 */
export interface FindkitSearchGroupParams {
    tagQuery: string[][];
    createdDecay?: number;
    modifiedDecay?: number;
    decayScale?: string;
    highlightLength?: number;
    size?: number;
    from?: number;
    lang?: string;
}

/**
 * @public
 */
export type FindkitSearchResponse = {
    groups: GroupSearchResults[];
    duration: number;
};

/**
 * @public
 */
export interface GroupSearchResults {
    total: number;
    duration?: number;
    hits: {
        score: number;
        title: string;
        language: string;
        url: string;
        domain: string;
        created: string;
        modified: string;
        highlight: string;
        tags: string[];
        customFields: CustomFields;
    }[];
}
