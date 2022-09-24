# Utils

### `select(selector, HTMLElement, callback)` {#select}

Like `document.querySelectoAll()` but runs the given CSS selector after the
DOMContentLoaded event and filters the results to given instance type. Does not
invoke the callback if no elements where matched.

The callback is invoked immediately when the DOMContentLoaded event has already
been fired.

Example

```ts
import { select } from "@findkit/ui";

select("button.close", HTMLButtonElement, (button) => {
	button.addEventListener("click", () => {
		ui.close();
	});
});
```

<Api page="ui.select" />

### `css` {#css}

Tagged template literal for Prettier CSS formating and syntax highlighting.
To be used with the `FinkditUI` [`css`](/ui/api/#css) option.

<Api page="ui.css" />
