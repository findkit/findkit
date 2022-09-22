# Slot Overrides

Slot Overrides are a way to replace some parts of the UI with custom ones. The
overrrides are basically Preact components since Findkit UI is implemented in
Preact. Even though Preact components are commonly written using JSX which
requires a JS compiler, with Findkit UI the components can be created
using with just plain Javascript without any external tools.

:::info
Preact is basically a re-implementation of React. If you know how to work with
React you can work with Preact and thus Findkit UI.
:::

We'll explain through an example where we create a custom input.

```ts
import { FindkitUI, html, useInput } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		// highlight-next-line
		Header() {
			const ref = useInput();
			return html`
				<input ref=${ref} placeholder="My custom input" type="text" />
			`;
		},
	},
});
```

Here we use a slot named `Header` which replaces the existing search input and
the close button with our own component. We use the `html` Javascript tagged
template literal to render our custom UI which is a prebound [HTM (Hyperscript
Tagged Markup)](https://github.com/developit/htm) tag and finally the
`useInput()` hook is used to bind the input to the search UI.

Try it on Codesandbox

<Codesandbox example="custom-input" />
