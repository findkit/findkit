# Routing

By default FindkitUI saves the current search terms and the possible group to
the URL Query String using the browser History API so user can come back to the
search search using the back button and keep the search terms after a page
refresh.

Unfortunately not all frameworks play well with the query string modification.
Alternative the terms can be saved to the url hash eg. after the `#` character
or kept completely in memory.

The change the behaviour set the [`router`](/ui/api/#router) option:

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	router: "hash", // or "memory"
});
```

## Custom Router

The router backend can be also completely customized by passing in custom <Api
page="ui.routerbackend" >RouterBackend </Api> implementation.

TODO: full example of the custom backend usage
