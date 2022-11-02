# Groups

To group search results you can define a `groups` array with titles and group
specific search [Search Params](/ui/api/params).

[Live demo at the bottom 👇](#try-it)

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	groups: [
		{
			title: "Pages",
			id: "pages",
			previewSize: 3,
			params: {
				// Search Params
				tagQuery: [["html"]],
			},
		},
		{
			title: "PDF-files",
			id: "pdf",
			previewSize: 3,
			params: {
				tagQuery: [["pdf"]],
			},
		},
	],
});
```

When a search is made with this configuration it will display results from each
group as searches are made. The result amount per group is determined by the
`previewSize` key.

:::caution
The `groups` option cannot be mixed with the `params` option. Eg. this does not work:

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {}  // ❌ Broken!!
	groups: [], // ❌ Broken!!
});
```

:::

## Dynamic Update

The groups can be also updated on the fly with `ui.updateGroups(fn)` method:

```ts
ui.updateGroups((pages, pdf) => {
	pages.previewSize = 5;
	pdf.previewSize = 5;
});
```

There is also a [`useGroups()`](/ui/slot-overrides/hooks#usegroups) hook for updating the groups from [Slot Overrides](/ui/slot-overrides/).

## Options

Following options are available for each group.

### `id: string`

Unique id of the group. Required.

### `title: string`

Title of the group. Displayed within the search results.

### `params: object`

The same as [Search Params](/ui/api/params).

### `previewSize?: number`

How many search results to show when all groups are rendered.

### `relevancyBoost?: number`

Boost (multiply) the results relevancy within the group. Meaningful only when the
groups are ordered by relevancy. TODO: link to the option dokumentation

## Try it!

<Codesandbox example="static/grouping" />
