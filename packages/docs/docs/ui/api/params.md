# Search Params

The search request can be customized with the `params` option

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// highlight-next-line
	params: {
		// Limit results to example.com domain
		tagQuery: [["domain/example.com"]],
	},
});
```

## Dynamic Update

The params can be also dynamically updated using the `ui.updateParams(fn)`
method which can be used the mutate the underlying params object:

```ts
ui.updateParams((params) => {
	params.tagQuery = [["domain/another.example"]];
});
```

The updates are immediately picked up and new a search request will be made on
change.

There is also a [`useParams()`](/ui/slot-overrides/hooks#useParams) hook for
updating the params from [Slot Overrides](/ui/slot-overrides).

## Params

Following keys are available:

### `createdDecay?: number` {#createdDecay}

0-1 numerical value for demoting old pages

### `modifiedDecay?: number` {#modifiedDecay}

0-1 numerical value for demoting stagnant pages

### `decayScale?: string` {#decayScale}

To be used with `createdDecay` or `modifiedDecay`. Defines in which timeframe
decay filter is applied, e.g. "7d".

### `highlightLength?: number` {#highlightLength}

The length of returned hilight string. Se to `0` disable highlighting.

:::caution
Too large values might slow down the search.
:::

### `size?: number` {#size}

How many results to fetch in a single request.

### `lang?: string` {#lang}

Limit results to the given language.

### `tagQuery: string[][]` {#tagQuery}

Limit results to the given "tag query".

Logical AND and OR operators are supported.

OR-syntax:

```js
[["A", "B", "C"]]; // A OR B OR C
```

AND-syntax:

```js
[["A"], ["B"], ["C"]]; // A AND B AND C
```

combining queries:

```js
[["A"], ["B", "C"]]; // A AND (B OR C)
```

Complex tag queries can be expensive. Because of this, it's recommended that you
[preprocess your pages to have meaningful tags](/crawler/tagging).

For example if there is 100 different sports categories on your website and you want to
show all the search results in a group "Sports". Instead of giving each sport a
specific tag name and querying it `swimming OR biking OR ...`
give each sport page a `sport` tag and use it in the query.
