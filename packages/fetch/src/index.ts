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
	publicToken?: string;
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

let logResponseTimes = false;

if (typeof window !== "undefined") {
	logResponseTimes =
		window.localStorage.getItem("findkit-log-response-times") === "true";
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

	const findkitFetch: FindkitFetch = async (options: FindkitFetchOptions) => {
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

		// new implementation
		const fetchUrl = getSearchEndpoint(options);
		const started = Date.now();
		const requestBody = getRequestBody(options);

		if (!currentJwtTokenPromise) {
			refresh();
		}

		const token = await currentJwtTokenPromise;

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

		const res = await fetch(fetchUrl, fetchOptions);

		if (res.status === 403) {
			const error: JwtErrorResponse = await res.json();

			if (error.error.type === "jwt-expired") {
				refresh();
				return findkitFetch(options);
			}

			throw new Error("[findkit] Permission denied: " + error.error.type);
		}

		if (!res.ok) {
			throw new Error("[findkit] Bad response from search: " + res.status);
		}

		const responses: FindkitSearchResponse = await res.json();

		if (options.logResponseTimes || logResponseTimes) {
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

export function getRequestBody(
	options: FindkitFetchOptions
): FindkitSearchParams {
	return {
		q: options.q,
		groups: options.groups,
	};
}

function getSearchEndpoint(options: FindkitFetchOptions) {
	if (options.searchEndpoint) {
		return options.searchEndpoint;
	} else if (options.publicToken) {
		return getProjectSearchEndpoint(options.publicToken);
	} else {
		throw new Error("Unable to determine search endpoint");
	}
}

export function getProjectSearchEndpoint(publicToken: string) {
	return `https://search.findkit.com/c/${publicToken}/search?p=${publicToken}`;
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
	groups?: FindkitSearchGroupParams[];
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
