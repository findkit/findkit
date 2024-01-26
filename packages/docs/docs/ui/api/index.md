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

### `backdrop: boolean` {#backdrop}

_New in v0.18.0_

Show backdrop shadow when opened as a modal.

Default `false`

<Api page="ui.findkituioptions.backdrop" />

### `closeOnOutsideClick: boolean` {#closeOnOutsideClick}

_New in v0.18.0_

Close the modal when a non-focus traped element is clicked.

Default `false`

<Api page="ui.findkituioptions.closeOnOutsideClick" />

### `lockScroll: boolean` {#lockScroll}

Lock page scrolling. Only used with `mode: "modal"`. Defaults to `true`. You may
want set this to `false` when using the [Offset Modal
Pattern](/ui/patterns/embedding/offset) with page scrolling.

Use this CSS to enable page scrolling:

```css
.findkit--modal-container {
	inset: initial;
	position: absolute;
	width: 100%;
}
```

<Api page="ui.findkituioptions.lockScroll" />

### `shadowDom: boolean` {#shadowDom}

Enable or disable shadow dom. See [Styling](/ui/styling).

Defaults to `true`.

<Api page="ui.findkituioptions.shadowDom" />

### `cssLayers: boolean` {#cssLayers}

Enable or disable [CSS Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer).
See [Styling](/ui/styling#css-layers).

Defaults to `true`.

<Api page="ui.findkituioptions.cssLayers" />

### `slots: object` {#slots}

Inject custom components to into the UI. See [Slot
Overrides](/ui/slot-overrides/).

<Api page="ui.findkituioptions.slots" />

### `params: object` {#params}

Customize search request params. See [Search Params](/ui/api/params).

<Api page="ui.findkituioptions.params" />

### `groups: object[]` {#groups}

Group search results. See [Groups](/ui/api/groups).

<Api page="ui.findkituioptions.groups" />

### `groupOrder: "relevancy" | "static" | (a: GroupResults,b: GroupResults)=>number` {#groupOrder}

Group order logic. Defaults to `"static"` which preserves groups array order.

In "relevancy" mode groups are ordered based on the groups highest score.
Relevancy mode can be affected by groups' option
[`relevancyBoost`](/ui/api/groups#relevancyBoost), which is multiplied with the
result relevancy

_New in v0.20.0_

Also supports custom sort function which receives <Api page="ui.GroupResults" >GroupResults</Api> objects as the arguments.

<Api page="ui.findkituioptions.groupOrder" />

### `infiniteScroll: boolean` {#infiniteScroll}

Disable automatic result loading on scroll and require button click to load more
results.

<Api page="ui.findkituioptions.infiniteScroll" />

### `forceHistoryReplace: boolean` {#forceHistoryReplace}

_New in v0.12.0_

Set to true to force `history.replaceState` usage instead of
`history.pushState` with `querystring` and `hash` routers. Normally FindkitUI
uses History push when opening the modal so it can be closed using the browser
back button.

This is set to `true` when the [`container`](#container) option is used.

When using frontend frameworks such as Next.js that control the routing too
this can be used to fix navigation conflicts with the FindkitUI router with the
caveat of disabling the back button modal close.

<Api page="ui.findkituioptions.forceHistoryReplace" />

### `manageScroll: boolean` {#manageScroll}

_New in v0.12.0_

Manage scroll position by restoring it when user navigates back to the
FindkitUI view. Generally no need to disable this but if you have other
conflicting libraries or frameworks it might be helpful to disable it.

Defaults to `true`

<Api page="ui.findkituioptions.manageScroll" />

### `instanceId: string` {#instanceId}

When using multiple `FindkitUI` instances you must provide a custom
`instanceId` to avoid conflicts in the query strings and idendifying class
names. This is needed for example when you have global site search and a more
specific search running on the same page.

:::note
If you have only one search setup and you are getting an error about a
conflicting instance id it means you are accidentally doing multiple `new
Findkit()` calls without calling [`.dispose()`](#dispose) on the previous
instance.

### Hot Module Reloading

If you are using hot module loading you might need to dispose the UI instance
when the module is disposed:

```ts
// Vite
import.meta.hot?.dispose(() => {
	ui.dispose();
});

// Webpack, Next.js etc.
module.hot?.dispose(() => {
	ui.dispose();
});
```

### React Component

If you are creating the FindkitUI instance inside a React component you must
call the `dispose` method on a `useEffect` cleanup. See the [React custom
container example](/ui/patterns/embedding/react#custom-container).
:::

Defaults to `"fdk"`.

<Api page="ui.findkituioptions.instanceId" />

### `load: Function` {#load}

Custom async function for loading the implemention code.
See [Disable CDN](/ui/advanced/disable-cdn).

<Api page="ui.findkituioptions.load" />

### `searchEndpoint: string` {#searchEndpoint}

Send search requests to this custom endpoint.

<Api page="ui.findkituioptions.searchEndpoint" />

### `container: selectorOrElement` {#container}

Render the modal to a custom container. If not defined Findkit UI will create
one dynamically and appends it to `<body>`.

Can be defined as a CSS selector or as an `Element` object.

Automatically sets [`modal: false`](#modal) if not explicitly defined.

<Api page="ui.findkituioptions.container" />

### `modal: boolean` {#modal}

Set to `false` to disable the modal mode. This makes sense only when used with
a custom container with the [`container`](#container) option.

This disables following:

- Focus trapping
- Open/close modes. It is always "open".
- Scrolling in the container

<Api page="ui.findkituioptions.mode" />

### `header: boolean` {#header}

Set to `false` to hide the default modal header with the search input and the
close button. Useful with the non-fullscreen [embedding
patterns](/ui/patterns/embedding/) where the input is placed on the website
outside the Findkit UI context. Ex. in the site header.

<Api page="ui.findkituioptions.header" />

### `router: Router` {#router}

Possible values:

- `"querystring"` (default)
- `"hash"`
- `"memory"`

See [Routing](/ui/advanced/routing).

<Api page="ui.findkituioptions.router" />

### `fetchCount: number` {#fetchCount}

How many results to fetch in a single request.

<Api page="ui.findkituioptions.fetchCount" />

### `lang: string` {#lang}

_New in v0.5.0_

Set the UI language. If not defined the language is read from the `<html lang>`
attribute. See [`setLang`](#setLang). Not to be confused with the
[`lang`](/ui/api/params#lang) search param filter.

_Replaces deprecated ui.lang in v0.5.0_

<Api page="ui.findkituioptions.lang" />

### `translations: object` {#translations}

_New in v0.5.0_

Add the UI translations. See [`addTranslation`](#addTranslation).

See <Api page="ui.translationstrings">TranslationStrings</Api> for
the available transtion strings.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	lang: "sv",
	// Add translations
	translations: {
		sv: {
			close: "Stänga",
			// ... https://findk.it/strings
		},
	},
});
```

_Replaces deprecated ui.overrides in v0.5.0_

<Api page="ui.findkituioptions.translations" />

### `monitorDocumentLang: boolean` {#monitorDocumentLang}

_New in v0.5.0_

Update the UI language by monitoring `<html lang>` changes. Useful on
Single-Page Apps where the language can change without a page load.

Defaults to `true`

<Api page="ui.findkituioptions.monitorDocumentLang" />

### `fetchThrottle: boolean` {#fetchThrottle}

_New in v0.9.0_

Minimum time between search requests in milliseconds.

Defaults to `200`

<Api page="ui.findkituioptions.monitorDocumentLang" />

### `defaultCustomRouterData: object` {#defaultCustomRouterData}

_New in v0.9.0_

Default values to to emit from the
[`custom-router-data`](/ui/api/events#custom-router-data) event when
[`setCustomRouterData`](#setCustomRouterData) has not been called.

<Api page="ui.findkituioptions.defaultCustomRouterData" />

## Methods {#methods}

Following methods are available on the `FindkitUI` instance.

<Api page="ui.findkitui" />

### `.open(terms)` {#open}

Open the search modal. If search terms are passed in the input will populated
with it and a search request is made immediately.

### `.toggle()` {#toggle}

_New in v0.18.0_

Toggle the modal open / closed state.

<Api page="ui.findkitui.toggle" />

### `.search(terms)` {#search}

Make a search with the given search terms. Opens the modal if closed (and not
using `modal: false`). Populates all bound inputs with the given search terms.

<Api page="ui.findkitui.search" />

### `.openFrom(selectorOrElement)` {#openFrom}

Open the modal from the given element or elements. Select can be a `Element`
object or a CSS selector string. A cleanup function is returned which will
unbind all the event listeners when called.

Element is not added to the focus trap automatically. If the element is
visible on the page when the modal is open [`.trapFocus()`](#trapFocus)
should be manually called on the element.

If the given element contains `data-clicked="true"` the modal will be opened
immediately. This is useful on slow network situations when the user manages to
click the open button before the code loads. Use inline JavaScript to add the
attribute to ensure it is always added when clicked.

```html
<button type="button" onclick="this.dataset.clicked=true">
	Open Search Modal
</button>
```

_The attribute handling was added in v0.17.0_

<Api page="ui.findkitui.openfrom" />

### `.trapFocus(selectorOrElement)` {#trapFocus}

Add additional elements to the focus trap. For example if you want to add close
button outside of the modal use this to make it keyboard accessible.

A function is returned which will remove the element from the focus trap when
invoked.

<Api page="ui.findkitui.trapFocus" />

### `.setCustomRouterData(data)` {#setCustomRouterData}

_New in v0.9.0_

Set custom data to the Findkit Router. The value is flushed to the url only
when a search request is made. Eg. usually should be called right before
[`updateParams`](#updateParams) or [`updateGroups`](#updateGroups) or in the
[`fetch`](/ui/api/events#fetch) event.

The object values can only be strings. In Typescript terms the `data` type is
`{[key: string]: string }`.

- See [`custom-router-data`](/ui/api/events#custom-router-data) event
- See [`defaultCustomRouterData`](#defaultCustomRouterData) constructor option
- See [`useCustomRouterData`](/ui/slot-overrides/hooks#useCustomRouterData) slot override hook
- Read the [Custom Router Data](/ui/custom-router-data) page for more information

<Api page="ui.findkitui.setCustomRouterData" />

### `.bindInput(selectorOrElement)` {#bindInput}

Bind any input to the Search UI. The selector can be CSS string or the raw
`HTMLInputElement`. An unbind funtion is returned.

- Input value is throttled to UI search terms
- Focus is included in the focus trap
- The lazy load will be triggered when the input is focused

<Api page="ui.findkitui.bindInput" />

### `.preload(): Promise` {#preload}

Preload the implementation code and css. This is automatically called on
`mouseover` for elements passed to `.openFrom()` and on `focus` for inputs
passed to `.bindInput()`.

<Api page="ui.findkitui.preload" />

### `.close()` {#close}

Close the search modal.

<Api page="ui.findkitui.close" />

### `.activateGroup(idOrIndex)` {#activateGroup}

_New in v0.20.0_

Activate a [group](/ui/api/groups) by id or index. The ui will be navigated to the group. When in modal mode it does not open the modal. Call [`open`](#open) manually to open it.


### `.clearGroup()` {#activateGroup}

_New in v0.20.0_

Clear active group. The ui will be navigated to the multi-group view.

<Api page="ui.findkitui.clearGroup" />

### `.dispose()` {#dispose}

Close the search modal and discard the `FindkitUI` instance with its resources.
The modal cannot be opened any more after it is disposed.

<Api page="ui.findkitui.dispose" />

### `.updateParams(fnOrParams)` {#updateParams}

Update the [search params](/ui/api/params). It calls the given function
immediately giving the search params object as the first parameter. The object
can mutated or a new one can be returned. A new search request is sent when the
updated params differ from the previously used params.

Calls are throttled with leading invoke, meaning that the first call is made
immediately and subsequent calls every 200ms or what is defined in
[`fetchThrottle`](#fetchThrottle).

Example

```ts
ui.updateParams((params) => {
	params.filter.category = "kitchen";
});
```

It is also possible to replace the params completely by giving the params object directly

```ts
ui.updateParams({ filter: { category: "kitchen" } });
```

There is also [`useParams()`](/ui/slot-overrides/hooks#useParams) hook for slot overrides.

<Api page="ui.findkitui.updateparams" />

### `.updateGroups(fn)` {#updateGroups}

Group version of [`updateParams`](#updateParams) which operates on
[groups](/ui/api/groups) instead of single Search Params object.
The groups are spread to the function arguments.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	groups: [
		{ params: { filter: { tags: "html" } } },
		{ params: { filter: { tags: "pdf" } } },
	],
});

ui.updateGroups((pages, pdf) => {
	pages.previewSize = 5;
	pdf.previewSize = 5;
});
```

There is also [`useGroups()`](/ui/slot-overrides/hooks#useGroups) hook for slot overrides.

<Api page="ui.findkitui.updategroups" />

### `.setLang(lang)` {#setLang}

_New in v0.5.0_

Set the current UI language. See [`lang`](#lang).

<Api page="ui.findkitui.setLang" />

### `.addTranslation(lang, translation)` {#addTranslation}

_New in v0.5.0_

Args

- `language: string`
- `overrides: {[key: string]: string}`: Override the build-in translations
- `custom: {[key: string]: string}`: Add custom translation keys

Add a new UI translation. Can be used to override existing translation strings
as well. See <Api
page="ui.translationstrings">TranslationStrings</Api> for the
available transtion strings.

See [`translations`](#translations).

<Api page="ui.findkitui.addtranslation" />

### `.on()` {#on}

Args

- `eventName: string`
- `callback: (event) => void`

Bind event handled to an event. Returns an unbind function. See
[Events](/ui/api/events/).

<Api page="ui.findkitui.on" />

### `.once()` {#once}

Args

- `eventName: string`
- `callback: (event) => void`

Like `.on()` but unbound immediately after the first event. See
[Events](/ui/api/events/).

<Api page="ui.findkitui.once" />

## Properties {#properties}

### `.params` {#params-prop}

The current [Search Params](/ui/api/params)

<Api page="ui.findkitui.params" />

### `.groups` {#groups-prop}

The current [Groups](/ui/api/groups)

<Api page="ui.findkitui.groups" />

### `.terms` {#terms-prop}

The current search terms used on the last completed search request
