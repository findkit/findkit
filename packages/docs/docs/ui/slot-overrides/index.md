# Slot Overrides

Slot Overrides are a way to replace some parts of the UI with custom ones. The
overrrides are basically Preact components since Findkit UI is implemented in
Preact. Even though Preact components are commonly written using JSX which
requires a JS compiler, with Findkit UI the components can be created
with just plain Javascript without any external tools.

See [Slots](/ui/slot-overrides/slots) for the available slots.

:::info
Preact is a re-implementation of React. If you know how to work with React you
can work with Preact and thus Findkit UI slot overrides.
:::

Lets go through a small example where we implement custom search input:

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
the close button with our own component. We use the
[`html`](/ui/slot-overrides/hooks#html) Javascript tagged template literal to
render our custom UI and finally the
[`useInput()`](/ui/slot-overrides/hooks#useinput) hook is used to bind the input
to the search UI.

Here's live demo

<Codesandbox example="static/custom-input" />

## Props

Each slot receives a `children` property which can be used to render the default
slot content. This can used to render custom elements before or after the content.

Here's how you would render content before the build-in input:

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Header(props) {
			return html`
				<h1>My custom title</h1>
				${props.children}
			`;
		},
	},
});
```

## Hooks

FindkitUI also provides few hooks to work with the internal UI state. See [Hooks
and Utils](/ui/slot-overrides/hooks) for details.

Here's an example how to use the custom hooks to create custom filtering buttons
into the search UI:

<Codesandbox example="static/use-params" />

## Caveats

:::danger
Do not use hooks imported from the `"preact"` package in the slot override
components. It will not work because Findkit UI [bundles Preact inside
itself](/ui/tech) and it works only with hooks bound to it. All hooks must be
imported from the `@findkit/ui` package. See [`preact`
util](/ui/slot-overrides/hooks#html).

```ts
import { preact } from "@findkit/ui";

const { useState } = preact;

function SlotComponent() {
	const [state, setState] = useState();
	// ...
}
```
:::
