# Slots

<Api page="ui.slots" >Api docs for all slots</Api>.

### `Header`

#### Props

- `Input`: Component for the close button
- `CloseButton`: Component for the close button
- `children`

The search input and close button area which hides on scroll.

The component props can be used to render only part of the header elements.

Example: Render only the input

```ts
import { FindkitUI, html } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Header(props) {
			return html`<${props.Input} />`;
		},
	},
});
```

<Api page="ui.slots.header" />

### `Content`

#### Props

- `children`

The content below the header.

<Api page="ui.slots.content" />

### `Layout`

#### Props

- `children`
- `header`: The header element
- `content`: The content element

The containing element for the header and the content elements. This slot can be
used to customize the element positioning. For example it can be used to
<Codesandbox link example="static/external-input">completely remove the header</Codesandbox>
or add side panels with tag filters etc.

<Api page="ui.slots.layout" />

## `Hit`

TODO
