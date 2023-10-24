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
			previewSize: 3,
			params: {
				// Search Params
				tagQuery: [["html"]],
			},
		},
		{
			title: "PDF-files",
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

The groups can be dynamically updated using the
[`ui.updateGroups()`](/ui/api/#updateGroups) method and the
[`useGroups()`](/ui/slot-overrides/hooks#useParams) hook to update from [Slot
Overrides](/ui/slot-overrides).

:::caution
The `groups` option cannot be mixed with the top-level `params` option because
each group contains its own `params` as seen in the above example Eg. this does
not work:

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {}  // ❌ Broken!!
	groups: [], // ❌ Broken!!
});

```

:::

## Options

<Api page="ui.groupdefinition" />

### `title: string` {#title}

Title of the group. Displayed within the search results.

### `params: object` {#params}

The same as [Search Params](/ui/api/params).

### `previewSize?: number` {#previewSize}

How many search results to show when all groups are rendered.

### `relevancyBoost?: number` {#relevancyBoost}

Boost (multiply) the results relevancy within the group. Meaningful only when
[`groupOrder`](/ui/api/#groupOrder) is set to `relevancy`.

### `id: string` {#id}

Unique id of the group. Automatically generated if not defined. Can be used to
pick a specific group in [`.updateGroups()`](/ui/api/#updateGroups),
[`.groups`](/ui/api/#groups) or in the
[`useGroups()`](/ui/slot-overrides/hooks#useGroups) hook.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	groups: [
		// ...
		{ id: "pdf", title: "PDF-files" },
		// ...
	],
});

ui.updateGroups((...groups) => {
	const pdf = groups.find((g) => g.id === "pdf");
	pdf.params.filter.tags = "pdf";
});
```

## Try it!

<Codesandbox example="static/grouping" />
