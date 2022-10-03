# Events

Events emitted by the `FindkitUI` instance are hookable from the `.events` property.

Example:

```ts
const unsubscribe = ui.events.on("open", () => {
	alert("Modal opened!");
});
```

See the <Api page="ui.emitter" >`Emitter` class</Api> for the events API details and
the <Api page="ui.findkituievents" >`FindkitUIEvents` interface</Api> for the available
events.
