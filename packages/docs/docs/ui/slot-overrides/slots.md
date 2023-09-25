# Slots

<Api page="ui.slots" >Api docs for all slots</Api>.

### `Header`

#### Props

- `Input`: Component for the close button
- `CloseButton`: Component for the close button
- `children`: The original header content

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
used to customize the element positioning.

<Api page="ui.slots.layout" />

## `Hit`

- `children`
- `hit`: The <Api page="ui.searchresulthit">search result hit</Api>

Used to customize how the search results are rendered. See [Custom
Fields](/ui/slot-overrides/custom-fields).

<Api page="ui.slots.hit" />

Example

```tsx
const ui = new FindkitUI({
	publicToken: "pwrOBq0GR",
	slots: {
		Hit(props) {
			return html`
				<div>
					<h2>
						${props.hit.superwordsMatch ? "🔥" : ""}
						<a href=${props.hit.url}>${props.hit.title}</a>
					</h2>
					<p
						class="highlight"
						dangerouslySetInnerHTML=${{ __html: props.hit.highlight }}
					></p>
					tags: ${props.hit.tags.join(", ")}
				</div>
			`;
		},
	},
});
```
