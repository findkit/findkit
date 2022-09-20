---
sidebar_position: 3
---

# Grouping

[Tag Queries](/ui/params#tagquery-string) are mainly used to group the results.

Instead of passing `params` you can pass in `groups` which is an array of
params objects with a `title` and a `id` keys.

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	groups: [
		{
			id: "pages",
			title: "Pages",
			tagQuery: [["html"]],
			previewSize: 3,
		},
		{
			id: "pdf",
			title: "PDF-files",
			tagQuery: [["pdf"]],
			previewSize: 3,
		},
	],
});
```

When a search is made with this configuration it will display results from each
group as searches are made. The result amount per group is determined by the
`previewSize` key.

Checkout this example to see how it works: <https://codesandbox.io/s/github/findkit/findkit/tree/main/packages/ui-examples/grouping>

The groups can be also updated on the fly with `ui.updateGroups(fn)` method:

```ts
ui.updateGroups((groups) => {
	groups[0].tagQuery.previewSize = 5;
});
```

## Keys

The groups support all the [params keys](/ui/params#keys) with following additions:

### `id: string`

Unique id of the group. Required.

### `title: string`

Title of the group. Displayed within the search results.

### `previewSize?: number`

How many search results to show when all groups are rendered.

### `scoreBoost?: number`

Boost (multiply) the results scores within the group. Meaningful only when the
groups are ordered by their highest score result. TODO: link to the option dokumentation
