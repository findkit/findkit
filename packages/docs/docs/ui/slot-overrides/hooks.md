# Hooks and Utils

Following utils can be imported from `"@findkit/ui"` for slot component usage.

Functions starting with the `use` keyword are
[Preact](https://preactjs.com/guide/v10/hooks/) hooks.

### `useParams()` {#useParams}

Hook for updating the [search params](/ui/api/params).

TODO: example

<Api page="ui.useparams" />

### `useGroups()` {#useGroups}

Hook for updating the [groups](/ui/api/groups).

TODO: example

<Api page="ui.usegroups" />

### `useTerms()` {#useTerms}

Return the search terms used for the current search results.

<Api page="ui.useterms" />

### `useInput()` {#useInput}

Hook for binding custom inputs as the search terms inputs. Usually used in the
[Header slot](/ui/slot-overrides/slots/#header) to override the default search
input with a fully custom one

```ts
import { FindkitUI, html, useInput } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Header(props) {
            const ref = useInput();
			return html`<input type="text" ref=${ref} />;
		},
	},
});
```


<Api page="ui.useinput" />

### `useTotalHitCount()` {#useTotalHitCount}

Return total hit count. Includes count from all groups if multiple groups are used.

<Api page="ui.usetotalhitcount" />

### `preact` {#preact}

Object of commonly used Preact Hooks. See the api docs for details.

<Api page="ui.preactfunctions" />

### `html` {#html}

Prebound HTM (Hyperscript Tagged Markup) tagged template. For more information see: <https://github.com/developit/htm>

<Api page="ui.html" />

### `h` {#h}

The Preact JSX pragma

<Api page="ui.h" />
