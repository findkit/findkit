# Custom Router Data

When building custom user interfaces for [`filter`](/ui/api/params#filter),
[`sort`](/ui/api/params#sort) or any other [search params](/ui/api/params) you
update dynamically via [`updateParams`](/ui/api/#updateParams) or
[`updateGroups`](/ui/api/#updateGroups) it is paramount that the UI is state is
saved to the URL: When user clicks on search result and decides to come back
the UI state and search params should restore to what they were.

Implementing this manually is tedious and hard to get right which is why
FindkitUI provides [`.customRouterData()`](/ui/api/#customRouterData) method
which allows developers to inject additional data to the URL when FindkitUI
updates the URL.

## Saving

Here's an example how we would save a plain HTML form data to the URL:

```html
<form>
	<input type="number" name="min" />
	<input type="number" name="max" />
</form>
```

```ts
const ui = new FindkitUI({ publicToken: "<TOKEN>" });
const form = document.querySelector("form");

// Make a search request on any form input change
form.addEventListener("input", () => {
	makeSearch();
});

ui.customRouterData({
	// The `init` is used to initialize the URL data
	// when the UI is loaded  without existing query string.
	init: { min: "0", max: "100" },
	save() {
		// Turn form into a plain js object
		return Object.fromEntries(new FormData(form));
	},
	load(data) {
		updateForm(data);
		// Make search here too since programmatic form
		// update does not trigger "input" events
		makeSearch();
	},
});
```

When a search request is made and FindkitUI decides it is a good time to update
URL the `save()` method is called and the returned object is serialized to the
URL query string. Ex. `?fdk.c.min=0&fdk.c.max=100`.

:::note
The object values can only be strings. In Typescript terms the return type is

```ts
{[key: string]: string}
```

:::

## Loading

When user navigates back to the search interface from the the search result
page or the user just opens a link with the query string the `load()` method is
called with the data previously returned from the `save()` method. In this
method you should update the form to reflect the data and make a search.

The `makeSearch()` method looks like this

```ts
function makeSearch() {
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

The `updateForm()` simply updates the form elements based on the js object:

```ts
function updateForm(data) {
	for (const [name, value] of Object.entries(data)) {
		form.elements.namedItem(name).value = value;
	}
}
```

## Live Demos

To put it all together see this example:

<Codesandbox example="static/custom-ui" />
