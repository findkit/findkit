# Slots

<Api page="ui.slots" >Api docs for all slots</Api>.

### `Header`

<Api page="ui.slots.header" />

#### Props

- `children`: The original header content
- `parts` <Api page="ui.slots.headerslotparts">details</Api>

The search input and close button area which hides on scroll.

The part props can be used to render only parts of the header element.

Example: Render only the input

```ts
import { FindkitUI, html } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	slots: {
		Header(props) {
			return html`<${props.parts.Input} />`;
		},
	},
});
```

### `Content`

<Api page="ui.slots.content" />

#### Props

- `children`

The content below the header.

### `Layout`

<Api page="ui.slots.layout" />

#### Props

- `children`
- `header`: The header element
- `content`: The content element

The containing element for the header and the content elements. This slot can be
used to customize the element positioning.

## `Group`

<Api page="ui.slots.Group" />

#### Props

- `title`: The group title string
- `previewSize`: The preview size number
- `total`: Total hits in the group
- `fetchedHits`: How many of the hits has been fetched
- `id`: The group id
- `parts` <Api page="ui.groupslotparts">details</Api>
- `children`

The list of hits on the initial view when using multiple [groups](/ui/api/groups).

## `Hit`

<Api page="ui.slots.hit" />

#### Props

- `children`
- `groupId`: The [group id](/ui/api/groups#id). New in v.0.15.0.
- `hit`: The <Api page="ui.searchresulthit">search result hit</Api>
- `parts` <Api page="ui.hitslotparts">details</Api>

Used to customize how the each search result hits are rendered. See [Custom
Fields](/ui/slot-overrides/custom-fields).

Example

```tsx
import { FindkitUI, html } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "pwrOBq0GR",
	slots: {
		Hit(props) {
			return html`
				<div>
					<h2>
						${props.hit.superwordsMatch ? "🔥" : ""}
						<a href=${props.hit.url}>${props.hit.title}</a>
						(${props.hit.score})
					</h2>
					<${props.parts.Highlight} />
					tags: ${props.hit.tags.join(", ")}
				</div>
			`;
		},
	},
});
```

<Codesandbox example="static/hit-slot" />
