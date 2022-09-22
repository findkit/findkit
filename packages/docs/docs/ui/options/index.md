---
sidebar_position: 2
---

# Options

The `FindkitUI` constructor supports following options for customization

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// highlight-next-line
	minTerms: 0,
	// ...
});
```

## Keys

### `publicToken: string`

The public token which identifies the Findkit Project. This can be seen from the
Hub or with `findkit status` CLI command.

This is the only required option.

### `minTerms: number`

Search terms threshold when to make the search request. Defaults to `3`. Can be
set to `0` as well when a search will be then made immediately when the UI is
rendered.

### `css: string`

Inject custom styles to the Shadow Root. See [Styling](/ui/styling).

### `shadowDom: boolean`

Disable shadow dom. See [Styling](/ui/styling).

### `slots: object`

Inject custom components to into the UI. See [Slot
Overrides](/ui/slot-overrides/).

### `params: object`

Customize search request params. See [`params`](/ui/options/params).

### `groups: object[]`

Group search results. See [Grouping](/ui/groups).

### `infiniteScroll: boolean`

Disable automatic result loading on scroll and require button click to load more
results.

### `instanceId: string`

When using multiple `FindkitUI` instances you must provide a custom
`instanceId` to avoid query string conflicts. Defaults to `"fdk"`.

### `load: Function`

Custom async function for loading the implemention code.
See [Disable CDN](/ui/advanced/disable-cdn).

### `searchEndpoint: string`

Send search requests to this custom endpoint.

### `container: HTMLElement`

Render the UI without the modal. See [Custom
Container](ui/advanced/custom-container).

### `router: Router`

See [Routing](/ui/advanced/routing).

### `ui: object`

TODO
