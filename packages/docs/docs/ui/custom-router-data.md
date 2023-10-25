# Custom Router Data

When building custom user interfaces for [`filter`](/ui/filtering/),
[`sort`](/ui/api/params#sort) or any other Search Params] you update
dynamically via `updateParams` or `updateGroups` it is paramount that the UI is
state is saved to the URL: When user clicks on a search result and decides to
come back the UI state and search params should be restored to what they were.

Implementing this manually is tedious and hard to get right which is why
FindkitUI provides [`.setCustomRouterData()`](/ui/api/#setCustomRouterData)
method which allows developers to add custom data to the URL and a
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

// On form changes
form.addEventListener("input", () => {
	// Save form state to the URL
	ui.setCustomRouterData(Object.fromEntries(new FormData(form)));

	// And make a search
	updateSearch();
});

// Restore form state from the URL on page load
ui.on("custom-router-data", (e) => {
	// Restore form input values
	for (const [name, value] of Object.entries(e.data)) {
		form.elements.namedItem(name).value = value;
	}

	// Update search too since programmatic form update
	// does not trigger the "input" events
	updateSearch();
});
```

Now the form state is synchronized to the URL and it is restored when user
navigates back to the search interface from another page.

The `updateSearch()` function looks like this:

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

## Demo

To put it all together see this example:

<Codesandbox example="static/custom-ui" />

## Complex Form {#complex}

This pattern can be used to synchronize much more complex states too. Checkout this
example using checkboxes, dropdown and radio buttons.

<Codesandbox example="static/shop" />

## React.js state {#react}

The URL state can be also synchronized the frontend framework state containers.
See this React.js example:

<Codesandbox example="bundled/react-custom-container" />
