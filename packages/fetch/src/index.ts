/**
 * @public
 */
export interface FindkitFetchInit {
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
	/**
	 * @deprecated use message field instead
	 */
	error?: string;
}

async function safeErrorJson(
	response: Response,
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

/**
 * Global JWT token fethcer
 */
declare const FINDKIT_GET_JWT_TOKEN: GetJwtToken | undefined;

/**
 * @public
 */
export function createFindkitFetcher(init: FindkitFetchInit) {
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
				q: options.terms,
				groups: options.groups,
			}),
		};

		const endpoint = new URL(searchEndpointString);

		if (token) {
			if (typeof token.jwt !== "string") {
				throw new Error(
					"[findkit] Expected GetJwtToken response to contain a 'jwt' property",
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

			throw new Error(
				"[findkit] Permission denied3: " + (error.message || error.error),
			);
		}

		if (!res.ok) {
			const error = await safeErrorJson(res);
			throw new Error(
				`[findkit] Bad response ${res.status} from search: ${
					error.message || error.error
				}`,
			);
		}

		const responses: FindkitSearchResponse = await res.json();
		return responses;
	};

	return {
		fetch: findkitFetch,
		clear,
		refresh,
	};
}

export function inferSearchEndpoint(options: FindkitFetchInit) {
	if (options.searchEndpoint) {
		return options.searchEndpoint;
	} else if (options.publicToken) {
		return createSearchEndpoint(options.publicToken);
	} else {
		throw new Error(`[findkit] publicToken or searchEndpoint is required`);
	}
}

/**
 * @public
 */
export function createSearchEndpoint(publicToken: string) {
	let version = "c";
	let subdomain = "search";

	let region = publicToken.split(":", 2)[1];

	// search.findkit.com is the eu-north-1 so must not set it explicitly
	if (region && region !== "eu-north-1") {
		subdomain = `search-${region}`;
	}

	try {
		const usp = new URLSearchParams(location.hash.slice(1));
		version = usp.get("__findkit_version") || version;
		subdomain = usp.get("__findkit_subdomain") || subdomain;
	} catch {
		// May crash for various reasons, no location object on a server, invalid
		// query string etc. We really don't care why it fails, since this is for
		// internal use only.
	}

	// prettier-ignore
	return `https://${subdomain}.findkit.com/${version}/${publicToken}/search?p=${publicToken}`;
}

/**
 * @public
 */
export interface FindkitSearchParams {
	/**
	 * Free form text query
	 */
	terms: string;

	/**
	 * Search groups
	 */
	groups?: FindkitSearchGroupParams[];

	/**
	 * Abort signal
	 */
	signal?: AbortSignal;
}

/**
 * @public
 */
export interface FindkitSearchGroupParams {
	operator?: "and" | "or";
	tagQuery?: string[][];
	tagBoost?: Record<string, number>;
	createdDecay?: number;
	modifiedDecay?: number;
	decayScale?: string;
	highlightLength?: number;
	semantic?: {
		mode: "only" | "hybrid" | "hybrid2";
		weight?: number;
		k?: number;
	};
	size?: number;
	from?: number;
	lang?: string;

	/**
	 * Do not actually execute the search, always return an empty result
	 */
	skip?: boolean;

	/**
	 * EXPERIMENTAL
	 *
	 * Return content for each hit. Must be explicitly enabled in the findkit.toml file
	 */
	content?: boolean;
}

/**
 * @public
 */
export type FindkitSearchResponse = {
	duration: number;
	groups: GroupSearchResults[];
	messages?: {
		id: string;
		message: string;
	}[];
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
		superwordsMatch: boolean;

		/**
		 * EXPERIMENTAL
		 * Only present if the content parameter was set in the request
		 */
		content?: string;
	}[];
}
