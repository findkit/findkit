# Events

Events emitted by the `FindkitUI` instance are hookable from the `.events` property.

Example:

```ts
const unsubscribe = ui.events.on("open", () => {
	alert("Modal opened!");
});
```

See the <Api page="ui.emitter" >`Emitter` class</Api> for the events API details

## Events

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

Emitted when a search request is started.

<Api page="ui.fetchevent">Event Object Interface</Api>

### `fetch-done`

Emitted when a search request completes

<Api page="ui.fetchdoneevent">Event Object Interface</Api>

### `hit-click`

When a search hit is clicked.

<Api page="ui.hitclickevent">Event Object Interface</Api>

### `dispose`

Emitted when the `FindkitUI` instance is discarded with the `.dispose()` method.

---

<Api page="ui.findkituievents" >Full events api</Api>
