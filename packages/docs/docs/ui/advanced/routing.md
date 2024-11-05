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

## Custom Router

The router backend can be also completely customized by passing in custom <Api
page="ui.routerbackend" >RouterBackend </Api> implementation.

TODO: full example of the custom backend usage

## Reserved query parameters {#reserved_query_parameters}

Because Findkit state is stored in URL, the param keys need to be unambigious.
Because there can be one or more Findkits in a page this is true between instances.

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
