# Routing

By default FindkitUI saves the current search terms and the possible group to
the URL Query String using the browser History API so user can come back to the
search results using the back button and keep the search terms after a page
refresh.

Unfortunately not all frameworks play well with the query string modification.
Alternatively the terms can be saved to the url hash eg. after the `#` character
or kept completely in memory.

The change the behaviour set the [`router`](/ui/api/#router) option:

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	router: "hash", // or "memory"
});
```

## Query String Router {#querystring}

The default. The search terms are saved to the query string, e.g.
`?fdk_q=terms`. The search survives page refreshes, the results can be shared
as links and the back button closes the search.

<Codesandbox example="static/router-querystring" />

## Hash Router {#hash}

Saves the search terms to the URL hash, e.g. `#fdk_q=terms`. Works like the
query string router but the hash is not sent to the server, so use this when
the server, caching or the framework does not play well with query string
changes or when you don't want the query string to be visible in the URL.

<Codesandbox example="static/router-hash" />

## Memory Router {#memory}

Keeps the search state only in memory. The URL is never modified but the
search terms are lost on page refresh, the result views cannot be shared as
links and the back button does not close the search.

<Codesandbox example="static/router-memory" />

## Custom Router {#custom}

The router backend can be also completely customized by passing in a custom <Api
page="ui.routerbackend" >RouterBackend </Api> implementation.

A common real world use case is a web app built on a framework with its own
client-side router such as Next.js, React Router or Vue Router. These routers
own the URL, and query string or hash updates made from the outside can
trigger unwanted re-renders or get reverted on navigation. With a custom
router backend the search state can be kept out of the URL entirely, or wired
to the framework router's own navigation API instead of the History API.

The example below implements a `sessionStorage` backend for such an app: the
URL is never touched, but unlike with the `memory` router the search state
still survives a page refresh.

```ts
import { FindkitUI, RouterBackend } from "@findkit/ui";

function createSessionStorageBackend(): RouterBackend<{}> {
	const storageKey = "findkit-search";
	const listeners = new Set<() => void>();

	// Corresponds to history.state in the built-in routers.
	// Used for scroll position restoring etc.
	let state = {};

	return {
		// Return the current search state as a query string
		// (without the leading "?")
		getSearchParamsString: () => sessionStorage.getItem(storageKey) ?? "",

		// Persist the new params and notify the UI of the change. The
		// search is triggered from these change events, not directly
		// from the input.
		update: (next, options) => {
			// The UI replaces the state without changing the params when
			// it saves the scroll position etc. The listeners must be
			// called for these updates too.
			const replacingState = options?.push === false && options.state;

			if (options?.state) {
				state = options.state;
			}

			if (sessionStorage.getItem(storageKey) === next && !replacingState) {
				return;
			}

			sessionStorage.setItem(storageKey, next);

			for (const listener of listeners) {
				listener();
			}
		},

		// The UI subscribes to the search state changes. Return an
		// unsubscribe function.
		listen: (cb) => {
			listeners.add(cb);
			return () => listeners.delete(cb);
		},

		// Used for hrefs in the group "show more" links. There is no URL
		// to point to with sessionStorage so return a placeholder. The UI
		// intercepts the clicks anyway.
		formatHref: () => "#",

		getState: () => state,
	};
}

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	router: createSessionStorageBackend(),
});
```

Things to keep in mind when implementing a backend:

- `getSearchParamsString()` and `update()` speak plain
  [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
  strings without the leading `?` or `#`. The backend decides where that
  string physically lives: the query string, the hash, storage, the framework
  router's state...
- `update()` must call the listeners when the state changes. The built-in
  query string router gets this for free from the History API monkey patching
  but a custom backend must call them manually. Note that the listeners must
  be called also when only the `options.state` is replaced without a params
  string change, as the UI does this when saving the scroll position.
- `options.state` in `update()` and `getState()` carry the equivalent of
  `history.state` which is used for scroll position restoring. Returning `{}`
  from `getState()` is acceptable but the scroll restoring stops working.

An invalid backend object missing some of the methods throws an error when
the UI loads.

<Codesandbox example="static/router-custom" />

## Reserved URL-parameters {#reserved-url-parameters}

Because Findkit state is stored in URL, the param keys need to be unambiguous.
Because there can be one or more Findkits in a page this is also true between instances.

Findkit reserves these query parameters:

- Default search key, `instanceId + separator + q`, e.g. `fdk_q` in `?fdk_q=test`
- Default group key, `instanceId + separator + id` e.g. `fdk_id` in `?fdk_q=test&fdk_id=group1`
- Default custom router data prefix, `instanceId + separator + c + separator` e.g. `fdk_c_` in `?fdk_q=test&fdk_c_mykey=foo`
- [searchKey](/ui/api/#searchKey), if passed
- [groupKey](/ui/api/#groupKey), if passed
- [customRouterDataPrefix](/ui/api/#customRouterDataPrefix), if passed

When a key is reserved, it cannot clash with another reserved key in the same Findkit
instance or any other Findkit instance on the page. Reserved keys function the same way
with all routing options.
