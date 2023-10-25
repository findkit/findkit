# Events

Events emitted by the `FindkitUI` instance. See [`on()`](/ui/api/#on) and
[`once()`](/ui/api/#once).

Example:

```ts
const unsubscribe = ui.on("open", () => {
	alert("Modal opened!");
});
```

## Event Names

The available event names.

### `open`

When the modal is opened

<Api page="ui.openevent">Event Object Interface</Api>

### `request-open`

When the modal is requested to open. Used to add loading indicators when the
lazy loading has not yet happened. Emitted before `open` event.

<Api page="ui.requestopenevent">Event Object Interface</Api>

### `close`

Emitted when the modal is closed

### `debounced-search`

Emitted when the user has stopped typing search terms. Used to for search analytics.

<Api page="ui.debouncedsearchevent">Event Object Interface</Api>

### `params`

Emitted when the [`.params`](/ui/api/#params-prop) changes from a [`.updateParams()`](/ui/api/#updateParams) call.

<Api page="ui.paramschangeevent">Event Object Interface</Api>

### `groups`

Emitted when the [`.groups`](/ui/api/#groups-prop) changes from a [`.updateGroups()`](/ui/api/#updateGroups) call.

<Api page="ui.groupschangeevent">Event Object Interface</Api>

### `status`

Emitted when the status changes

<Api page="ui.statuschangeevent">Event Object Interface</Api>

### `fetch`

Emitted right before sending a search request.

<Api page="ui.fetchevent">Event Object Interface</Api>

### `fetch-done`

Emitted when a search request completes

<Api page="ui.fetchdoneevent">Event Object Interface</Api>

### `hit-click`

When a search hit is clicked.

<Api page="ui.hitclickevent">Event Object Interface</Api>

### `lang`

_New in v0.5.0_

Emitted when

- `<html lang>` is initially read
- `<html lang>` is mutated
- Language is set explicitly with [`setLang`](/ui/api/#setLang)

<Api page="ui.languagechangeevent">Event Object Interface</Api>

### `custom-router-data`

_New in v0.9.0_

Emits data previously set using the
[`setCustomRouterData`](/ui/api/#setCustomRouterData) method when the Findkit
router reads the URL. If there is no custom data in the URL
[`defaultCustomRouterData`](/ui/api/#defaultCustomRouterData) is emitted. The
URL is read on page load and on History
[`pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
and
[`replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)
calls.

Read the [Custom Router Data](/ui/custom-router-data) page for more
information.

```ts
ui.on("custom-router-data", (e) => {
	// Use e.data to fill form inputs, update React/Vue/Svelte state...
	// Update search params using .updateParams()
});
```

<Api page="ui.CustomRouterDataEvent">Event Object Interface</Api>

### `bind-input`

_New in v0.8.0_

Emitted when an input is bound using [`.bindInput()`](/ui/api/#bindInput) or [`useInput()`](/ui/slot-overrides/hooks#useInput).
This is also called for the build-in input.

<Api page="ui.bindinput">Event Object Interface</Api>

### `unbind-input`

_New in v0.8.0_

When an input is unbound using the unbound method returned from
[`.bindInput()`](/ui/api/#bindInput). Emitted also when the UI is disposed with
[`.dispose()`](/ui/api/#dispose).

Use to properly cleanup any listeners you set on the `bind-input` event.

Example

```ts
ui.on("bind-input", (e1) => {
	const listener = () => {
		/* whatever */
	};

	e1.input.addEventListener("focus", listener);

	ui.once("unbind-input", (e2) => {
		if (e1.input === e2.input) {
			e.input.removeEventListener("focus", listener);
		}
	});
});
```

<Api page="ui.bindinput">Event Object Interface</Api>

### `dispose`

Emitted when the `FindkitUI` instance is discarded with the [`.dispose()`](/ui/api/#dispose) method.

---

<Api page="ui.findkituievents" >Full events api</Api>
