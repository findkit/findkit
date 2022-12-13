/**
 * @public
 */
export interface FindkitFetchInit {
	staging?: boolean;
	logResponseTimes?: boolean;
	publicToken?: string;
	searchEndpoint?: string;
	getJwtToken?: GetJwtToken;
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
export interface FindkitFetch {
	(options: FindkitSearchParams): Promise<FindkitSearchResponse>;
}

/**
 * @public
 */
export interface FindkitErrorResponse {
	code?: "jwt-expired" | "jwt-invalid" | "invalid-response-body";
	message?: string;
}

async function safeErrorJson(
	response: Response
): Promise<FindkitErrorResponse> {
	const text = await response.text().catch(() => {
		return "Failed to read response body";
	});

	try {
		return JSON.parse(text);
	} catch {
		return {
			code: "invalid-response-body",
			message: `body: ${text.slice(0, 500)}`,
		};
	}
}

/**
 * @public
 */
export interface GetJwtToken {
	(options: {
		publicToken?: string;
		searchEndpoint: string;
	}): Promise<JwtToken>;
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

let logResponseTimes = false;

if (typeof window !== "undefined") {
	try {
		logResponseTimes =
			window.localStorage.getItem("findkit-log-response-times") === "true";
	} catch {
		// local storage access can throw in some enviroments such a
		// codesandox.io due to permission issues
	}
}

/**
 * Global JWT token fethcer
 */
declare const FINDKIT_GET_JWT_TOKEN: GetJwtToken | undefined;

/**
 * @public
 */
export function createFindkitFetcher(init?: FindkitFetchInit) {
	let currentJwtTokenPromise: Promise<JwtToken> | null = null;

	/**
	 * For internal tests only
	 */
	function clear() {
		currentJwtTokenPromise = null;
	}

	const searchEndpointString = inferSearchEndpoint(init);

	const refresh = () => {
		const getJwtTokenArg: Parameters<GetJwtToken>[0] = {
			searchEndpoint: searchEndpointString,
		};

		if (typeof init?.getJwtToken === "function") {
			currentJwtTokenPromise = init.getJwtToken(getJwtTokenArg);
		} else if (typeof FINDKIT_GET_JWT_TOKEN === "function") {
			currentJwtTokenPromise = FINDKIT_GET_JWT_TOKEN(getJwtTokenArg);
		}
	};

	const findkitFetch: FindkitFetch = async (options: FindkitSearchParams) => {
		if (!options.groups) {
			options = {
				...options,
				groups: [
					{
						tagQuery: [],
					},
				],
			};
		}

		const started = Date.now();

		if (!currentJwtTokenPromise) {
			refresh();
		}

		const token = await currentJwtTokenPromise;

		const headers: Record<string, string> = {
			// This looks wrong but is intentional. We want to make "Simple CORS
			// requests" eg. requests without the OPTIONS preflight and
			// application/json is not allowed for those. So we just have to use
			// one of the allowed ones.
			// See https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
			"Content-Type": "text/plain",
		};

		const fetchOptions: RequestInit = {
			method: "POST",
			signal: options.signal ?? null,
			mode: "cors",
			credentials: "omit",
			headers,
			body: JSON.stringify({
				q: options.q,
				groups: options.groups,
			}),
		};

		const endpoint = new URL(searchEndpointString);

		if (token) {
			if (typeof token.jwt !== "string") {
				throw new Error(
					"[findkit] Expected GetJwtToken response to contain a 'jwt' property"
				);
			}
			endpoint.searchParams.set("p", `jwt:${token.jwt}`);
		}

		const res = await fetch(endpoint.toString(), fetchOptions);

		if (res.status === 403) {
			const error = await safeErrorJson(res);

			if (error.code === "jwt-expired") {
				refresh();
				return findkitFetch(options);
			}

			throw new Error("[findkit] Permission denied: " + error.message);
		}

		if (!res.ok) {
			const error = await safeErrorJson(res);
			throw new Error(
				`[findkit] Bad response ${res.status} from search: ${error.message}`
			);
		}

		const responses: FindkitSearchResponse = await res.json();

		if (init?.logResponseTimes || logResponseTimes) {
			const total = Date.now() - started;
			const backendDuration = responses.duration;

			console.log(
				`[findkit] Response total ${total}ms, backend ${backendDuration}ms, network ${
					total - backendDuration
				}ms`
			);

			options.groups?.forEach((group, index) => {
				const duration = responses.groups[index]?.duration ?? 0;
				console.log(
					`[findkit] Group response ${duration}ms for group "${index}"`,
					group
				);
			});
		}

		return responses;
	};

	return {
		findkitFetch,
		clear,
		refresh,
	};
}

function inferSearchEndpoint(options?: FindkitFetchInit) {
	if (options?.searchEndpoint) {
		return options?.searchEndpoint;
	} else if (options?.publicToken) {
		return createSearchEndpoint(options.publicToken);
	} else {
		throw new Error("Unable to determine search endpoint");
	}
}

/**
 * @public
 */
export function createSearchEndpoint(publicToken: string) {
	return `https://search.findkit.com/c/${publicToken}/search?p=${publicToken}`;
}

/**
 * @public
 */
export interface FindkitSearchParams {
	q: string;
	groups?: FindkitSearchGroupParams[];
	signal?: AbortSignal;
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
