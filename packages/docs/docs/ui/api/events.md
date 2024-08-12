# Events

<FragmentOverride text="FindkitUI API" />

<Fragmented withH1 />

Events emitted by the `FindkitUI` instance. See [`on()`](/ui/api/#on) and
[`once()`](/ui/api/#once).

Example:

```ts
const unsubscribe = ui.on("open", () => {
	alert("Modal opened!");
});
```

The events are also emitted as [DOM events](#dom-events) on the `window`
object.

## Event Names

<FragmentOverride text="Event" />

The available event names.

### `loading` {#loading}

Delayed loading event. Fired when any network request issued by FinkditUI takes
more than usual due to bad network conditions. If the network is quick enough
this event never fires. Fired for the lazy load and search requests.

Used to implement loading indicator in a way it does not flash when the
responses instant. Clear the loading indicator in the
[`loading-done`](#loading-done) event.

If you need to know exactly when the search requests happen see
[`fetch`](#fetch) and [`fetch-done`](#fetch-done) events.

Also available as [`useLoading`](/ui/slot-overrides/hooks#useLoading) slot
override hook.

<Api page="ui.loading">Event Object Interface</Api>

### `loading-done` {#loading-done}

Fired when the [`loading`](#loading) event completes.

<Api page="ui.openevent">Event Object Interface</Api>

### `open`

When the modal is opened

<Api page="ui.openevent">Event Object Interface</Api>

### `loaded`

When the implentation code has been lazy loaded.

<Api page="ui.loadedevent">Event Object Interface</Api>

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

Emitted before sending a search request.

It possible to make transient updates to the search request inside the `fetch`
event handler either by updating the search terms on the event object
`event.terms` property or by calling the `event.transientUpdateParams()` or
`event.transientUpdateGroups()`. The updates are only used for that specific
search and are not not persisted to the internal FindkitUI state. The
`transient*` methods otherwise work like the normal
[`updateParams`](/ui/api/#updateParams) and
[`updateGroups`](/ui/api/#updateGroups) methods.

A common use case is to sort results by creation date when there are no search
terms and by relevancy when user types some search terms.

```ts
const ui = new FindkitUI({
	publicToken: "<token>",
	minTerms: 0,
});

ui.on("fetch", (event) => {
	// Sort by creation date when there is no search terms
	if (event.terms.length.trim() === "") {
		event.transientUpdateParams((params) => {
			params.sort = { created: { $order: "desc" } };
		});
	}
});
```

Another use case is to implement customs terms that actually are filters:

```ts
ui.on("fetch", (event) => {
	const tags = [];

	// Turn "tag:electronics computer" to "computer"
	event.terms = event.terms.replaceAll(/tag:([^ ]+)/g, (tag) => {
		tags.push(tag);
		return "";
	});

	// And filter using the "electronics" tag
	if (tags.length > 0) {
		event.transientUpdateParams({
			filter: { tags: { $all: tags } },
		});
	}
});
```

_The transient methods and terms updating is added in v0.13.0_

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

<Api page="ui.bindinputevent">Event Object Interface</Api>

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

### `init`

_New in v0.17.0_

Emitted when a FindkitUI instance is being constructed. Allows full
customization of the options passed to it. Useful when you need to modify a
FindkitUI instance when you cannot access the code actually creating the
instance. For example when the [Findkit WordPress plugin](https://findk.it/wp)
creates the instance in a Gutenberg block.

Since this event is fired from the constructor it is only usable from the [DOM
Event](#dom-events).

Example

```ts
window.addEventListener("findkituievent", (e) => {
	if (e.detail.eventName !== "init") {
		return;
	}

	if (e.detail.instance.id !== "my") {
		return;
	}

	// See API docs for what is available
	// https://docs.findkit.com/ui-api/ui.initevent/
	const { css } = e.detail.data.utils;
	const { useState } = e.detail.data.preact;

	e.detail.data.options.minTerms = 5;

	e.detail.data.options.css = css`
		.modified {
			color: red;
		}
	`;

	e.detail.data.options.slots = {
		Header(props) {
			const [state] = useState("preact state");

			return html`
				${props.children}
				<div class="modified">Hello</div>
			`;
		},
	};
});
```

<Api page="ui.initevent">Event Object Interface</Api>

## DOM Events {#dom-events}

All events are emitted as DOM events on the `window` object as well. This
allows for example analytics tools to bind to all FindkitUI instances without
having access to the code that actually creates the instances. For example
the ones created by the [Findkit WordPress plugin](https://findk.it/wp).

The events are wrapped into a `findkituievent`
[CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).

Example

```ts
window.addEventListener("findkituievent", (e) => {
	// The FindkitUI instance
	e.detail.instance;

	// This event may come from multiple instances so you should guard using
	// the instance id.
	if (e.detail.instance.id !== "my") {
		// Only interested on events from `new FindkitUI({instanceId: "my"})`
		return;
	}

	// The FindkitUI event name
	if (e.detail.eventName !== "fetch") {
		return;
	}

	// The data passed to the event
	e.detail.data;
	e.detail.data.terms;
	e.detail.data.transientUpdateParams();
	// ...
});
```
