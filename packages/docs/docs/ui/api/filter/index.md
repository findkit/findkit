# Filter

Filter is a [Search Params](/ui/api/params) option for filtering the search
results with complex conditions in addition to search terms. The filter can be
used for groupping or building highly dynamic search interfaces by manipulating
the filters based on user the input.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		filter: {
			created: { $gt: "2023-02-04" },
		},
	},
});
```

:::caution
When building custom user interfaces make sure you make the UI state linkable with
[Custom Router Data](/ui/api/custom-router-data)
:::

It can target [`tags`](/crawler/meta-tag#tags),
[`created`](/crawler/meta-tag#created),
[`modified`](/crawler/meta-tag#modified),
[`language`](/crawler/meta-tag#language) and any [custom
fields](/crawler/meta-tag#customFields) exposed by the [Findkit Meta Tag](/crawler/meta-tag).

The `filter` option is available in

- [`params`](/ui/api/#params) constructor option
- [`groups`](/ui/api/#groups) constructor option
- [`updateParams`](/ui/api/#updateParams) method
- [`updateGroups`](/ui/api/#updateGroups) method
- [`useParams`](/ui/slot-overrides/hooks#useParams) slot override hook
- [`useGroups`](/ui/slot-overrides/hooks#useGroups) slot override hook

:::tip
If you are familiar with MongoDB queries you should feel right at home with Findkit
Filters as they implement subset of the MongoDB filters.
:::

Read [How Filtering Works?](/ui/api/filter/intro) for overview of how to use
them and see [Operators](/ui/api/filter/operators) for all available filtering
tools
