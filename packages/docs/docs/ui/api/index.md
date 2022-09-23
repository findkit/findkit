---
sidebar_position: 2
---

# API

The `FindkitUI` constructor supports following options for customization

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// highlight-next-line
	minTerms: 0,
	// ...
});
```

## Constructor Options

<Api page="ui.findkituioptions" />

### `publicToken: string` {#publicToken}

The public token which identifies the Findkit Project. This can be seen from the
Hub or with `findkit status` CLI command.

This is the only required option.

<Api page="ui.findkituioptions.publicToken" />

### `minTerms: number` {#minTerms}

Search terms threshold when to make the search request. Defaults to `3`. Can be
set to `0` as well when a search will be then made immediately when the UI is
rendered.

<Api page="ui.findkituioptions.minTerms" />

### `css: string` {#css}

Inject custom styles to the Shadow Root. See [Styling](/ui/styling).

<Api page="ui.findkituioptions.css" />

### `shadowDom: boolean` {#shadowDom}

Disable shadow dom. See [Styling](/ui/styling).

<Api page="ui.findkituioptions.shadowDom" />

### `slots: object` {#slots}

Inject custom components to into the UI. See [Slot
Overrides](/ui/slot-overrides/).

<Api page="ui.findkituioptions.slots" />

### `params: object` {#params}

Customize search request params. See [Search Params](/ui/api/params).

<Api page="ui.findkituioptions.params" />

### `groups: object[]` {#groups}

Group search results. See [Grouping](/ui/groups).

<Api page="ui.findkituioptions.groups" />

### `infiniteScroll: boolean` {#infiniteScroll}

Disable automatic result loading on scroll and require button click to load more
results.

<Api page="ui.findkituioptions.infiniteScroll" />

### `instanceId: string` {#instanceId}

When using multiple `FindkitUI` instances you must provide a custom
`instanceId` to avoid query string conflicts. Defaults to `"fdk"`.

<Api page="ui.findkituioptions.instanceId" />

### `load: Function` {#load}

Custom async function for loading the implemention code.
See [Disable CDN](/ui/advanced/disable-cdn).

<Api page="ui.findkituioptions.load" />

### `searchEndpoint: string` {#searchEndpoint}

Send search requests to this custom endpoint.

<Api page="ui.findkituioptions.searchEndpoint" />

### `container: HTMLElement` {#container}

Render the UI without the modal. See [Custom
Container](ui/advanced/custom-container).

<Api page="ui.findkituioptions.container" />

### `router: Router` {#router}

See [Routing](/ui/advanced/routing).

<Api page="ui.findkituioptions.router" />

### `ui: object` {#ui}

TODO

## Methods and Properties {#class}

Following methods are available on the `FindkitUI` instance.

<Api page="ui.findkitui" />

### `.open(terms?: string)` {#open}

Open the search modal. If search terms are passed in the input will populated
with it and a search request is made immediately.

### `.openFrom(select)`

Open the modal from the given element or elements. Select can be a `Element`
object or a CSS selector string. A cleanup function is returned which will
unbind all the event listeners when called.

<Api page="ui.findkitui.openfrom" />

### `.close()` {#close}

Close the search modal.

<Api page="ui.findkitui.close" />

### `.dispose()` {#dispose}

Close the search modal and discard the `FindkitUI` instance with its resources.
The modal cannot be opened any more after it is disposed.

<Api page="ui.findkitui.dispose" />

### `.updateParams()` {#updateParams}

Update the search params.

TODO: More detailed docs.

<Api page="ui.findkitui.updateparams" />

### `.updateGroups()` {#updateGroups}

Update the groups.

TODO: More detailed docs.

<Api page="ui.findkitui.updategroups" />