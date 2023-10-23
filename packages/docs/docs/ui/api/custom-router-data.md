# Custom Router Data

When building custom user interfaces for [`filter`](/ui/api/params#filter),
[`sort`](/ui/api/params#sort) or any other [search params](/ui/api/params) you
update dynamically via [`updateParams`](/ui/api/#updateParams) or
[`updateGroups`](/ui/api/#updateGroups) it is paramount that the UI is state is
saved to the URL: When user clicks on a search result and decides to come back
the UI state and search params should restore to what they were.

Implementing this manually is tedious and hard to get right which is why
FindkitUI provides [`.setCustomRouterData()`](/ui/api/#setCustomRouterData)
method which allows developers to inject custom data to the URL and a
[`custom-router-data`](/ui/api/events#custom-router-data) event which can be
used to read the previously set data.

Here's an example how we would save a plain HTML form data to the URL:

```html
<form>
	<input type="number" name="min" />
	<input type="number" name="max" />
</form>
```

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	defaultCustomRouterData: { min: "0", max: "100" },
});

const form = document.querySelector("form");

// Update search params on form changes
form.addEventListener("input", () => {
	updateSearch();
});

// Save form state to the URL when it was used to make a search
ui.on("fetch", () => {
	ui.setCustomRouterData(Object.fromEntries(new FormData(form)));
});

// Restore form state from the URL on page load and navigations
ui.on("custom-router-data", (e) => {
	// Fill form inputs
	for (const [name, value] of Object.entries(e.data)) {
		form.elements.namedItem(name).value = value;
	}

	// Update search from here too since programmatic form update
	// does not trigger the "input" events
	updateSearch();
});
```

Now every time when FindkitUI makes search request a `fetch` event is emitted
which is used to set the custom router data. This creates a query string like
`?fdk.c.min=0&fdk.c.max=100`.

When user navigates back to the search interface from the search result page or
just opens a link with the query string, the `custom-routerl-data` event is
emitted with the data previously set using the `setCustomRouterData()` method
which is used to restore the previous search.

:::note
We could set the custom router data in the form `input` event as well but the
`fetch` event is preferred as it is automatically throttled by FindkitUI. This
avoids excessive URL updating.
:::

The `updateSearch()` method looks like this

```ts
function updateSearch() {
	ui.updateParams((params) => {
		const data = Object.fromEntries(new FormData(form));

		const $and = [];

		if (data.min) {
			$and.push({ price: { $gte: data.min } });
		}

		if (data.max) {
			$and.push({ price: { $lte: data.max } });
		}

		params.filter.$and = $and;
	});
}
```

The [`updateParams()`](/ui/api/#updateParams) method always makes a new search
when the params change form the previously made search.

## Live Demos

To put it all together see this example:

<Codesandbox example="static/custom-ui" />
