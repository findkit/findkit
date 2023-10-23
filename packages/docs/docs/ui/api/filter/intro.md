# How Filtering Works?

Lets start with a simple example. Limit the results with tag a `product`:

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		filter: {
			tags: { $eq: "product" },
			// shorthand `tags: "product"`
		},
	},
});
```

if multiple fields are defined they are considered as `AND` condition. This
update would return only the results that have the tag `product` and a number
custom field `price` with value less than `100`:

```ts
ui.updateParams({
	filter: {
		tags: "product",
		price: { $lt: 100 },
	},
});
```

To make `OR` condition you need to use the [`$or`](/ui/api/filter/operators#$or) operator:

```ts
ui.updateParams({
	filter: {
		tags: "product",
		price: { $lt: 100 },
        // highlight-next-line
		$or: [{ category: "kitchen" }, { category: "furniture" } }],
	},
});
```

In addition to the existing conditions, this would require results to have
either `kitchen` or `furnite` value in a `category` keyword custom field.

Negations can be added with `$not`:

```ts
ui.updateParams({
	filter: {
		tags: "product",
		price: { $lt: 100 },
		$or: [{ category: "kitchen" }, { category: "furniture" } }],
        // highlight-next-line
        $not: { stock: 0 }
	},
});
```

If this filter were written in Javascript, it would look like this:

```js
if (
	tags.includes("product") &&
	price < 100 &&
	(category === "kitchen" || category === "furniture") &&
	stock !== 0
) {
	// return the result
}
```

These operators can be mixed freely. For example you can add any conditions to the
`$or` array. Even other nested `$or`s.

For a page to match this filter it should have a [Findkit Meta Tag](/crawler/meta-tag) like this:

```html
<script id="findkit" type="application/json">
	{
		"tags": ["product"],
		"customFields": {
			"price": {
				"type": "number",
				"value": 10
			},
			"category": {
				"type": "keyword",
				"value": "furniture"
			}
			"stock": {
				"type": "number",
				"value": 34
			},
		}
	}
</script>
```

For all possible filter operators see [Operators](/ui/api/filter/operators) page.
