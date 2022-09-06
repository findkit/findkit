---
sidebar_position: 2
---

# Filtering

By default all indexed content is searchable but you can limit the results
to a subset of the index using the [tag queries](/tag-query).

The tag query can be set when instantiating the `FindkitUI` class and it can be
dynamically updated later from the instance or using the hooks in [slot
overrides](/ui/slot-overrides) if you want to implement custom UI for filters.

You can also [group the results](/ui/groups) using the tag query.

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		// Limit results to example.com domain
		tagQuery: [["domain/example.com"]],
	},
});
```
