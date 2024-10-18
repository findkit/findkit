# Search Params

<FragmentOverride text="FindkitUI Search Param" />

<Fragmented withH1 />

The search request can be customized with the `params` option

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// highlight-next-line
	params: {
		// Limit results to example.com domain
		filter: { tags: "domain/example.com" },
	},
});
```

The params can be dynamically updated using the
[`ui.updateParams()`](/ui/api/#updateParams) method and the
[`useParams()`](/ui/slot-overrides/hooks#useParams) hook
to update from [Slot Overrides](/ui/slot-overrides).

## Options

<Api page="ui.searchparams" />

### `semantic: object` {#semantic}

_New in 1.4.0_

Make AI powered semantic search using text embedding vectors.
Requires [`ml_model`](/toml/options#ml_model) option in the TOML configuration
for the vectors to be generated.

Parameters:

- `mode: string`
  - `"only"`: Use only the semantic search, no keyword search
  - `"hybrid"`: Use both semantic and keyword search
- `weight: number`
  - Numerical value for the weight of the semantic search in the hybrid mode
- `k`: number
  - Number of nearest neighbors to fetch from the semantic search
  - Defaults to 5

Since semantic search cannot completely filter out results it is recommended to set [`operator: "or"`](#operator) with the hybrid mode.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		operator: "or",
		semantic: {
			mode: "hybrid",
			weight: 50,
			k: 5,
		},
	},
});
```

### `createdDecay: number` {#createdDecay}

0-1 numerical value for demoting old pages

### `modifiedDecay: number` {#modifiedDecay}

0-1 numerical value for demoting stagnant pages

### `decayScale: string` {#decayScale}

To be used with `createdDecay` or `modifiedDecay`. Defines in which timeframe
decay filter is applied, e.g. "7d".

### `highlightLength: number` {#highlightLength}

The length of returned hilight string. Se to `0` disable highlighting.

:::caution
Too large values might slow down the search.
:::

### `size: number` {#size}

How many results to fetch in a single request.

### `lang: string` {#lang}

Limit results to the given language. A two letter language code. Not to be
confused with the [`lang`](/ui/api/#lang) constructor option which sets the UI
language.

### `tagQuery: string[][]` {#tagQuery}

Legacy tags only filtering method. Please prefer the [filter](#filter) option which
is more intuitive and flexible to use.

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

### `tagBoost: Record<string, number>` {#tagBoost}

Boost page scores with certain tags.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		tagBoost: {
			important: 2,
		},
	},
});
```

This will increase the search score of pages with `important` tag by x2. It is
also possible to down boost by using boost numbers less than one. Ex. 0.5 to
drop the score to half.

### `sort: Sort` {#sort}

_New in v0.9.0_

Use alternative sorting. By default search results are sorted by the relevancy
score but it can be forced to be sorted by created or modified dates, keywords or by any
custom field.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		sort: {
			created: {
				$order: "asc",
			},
		},
	},
});
```

Multi-level sorting is also possible

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		sort: [
			{
				price: {
					$order: "asc",
				},
			},
			{
				created: {
					$order: "asc",
				},
			},
		],
	},
});
```

If sorting values are the same, the search results are sorted by the relevance score.

:::warning
It is not possible to sort by the build-in title field. If you need
to sort by the title, copy it to a keyword custom field and sort using
it.
:::

<Api page="ui.searchparams.sort" />

### `randomSort: RandomSort` {#randomSort}

_New in v1.4.0_

Give matching search results random relevancy scores, causing random result order.
Same seed generates same random result order, meaning pagination works normally.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		randomSort: { seed: Date.now() },
	},
});
```

With seed you can define "shared randoms" based on some value that is shared between users.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: {
		// set the random seed based on day of the month
		// meaning the results change every day
		// while all the users see the same results each day
		randomSort: { seed: new Date().getUTCDate() },
	},
});
```

:::warning
It is not possible to use `sort` and `randomSort` together.
Using both together will cause a search error.
:::

<Api page="ui.searchparams.randomsort" />

### `filter: Filter` {#filter}

_New in v0.9.0_

Filter the search results by tags, created, modified, language and custom field
using a MongoDB style filtering query. Read more on the
[Filtering](/ui/filtering) page.

<Api page="ui.filter" />

### `skip: boolean` {#skip}

_New in v0.15.0_

Skip the search and always return an empty response. Can be used to optimize the
search request when visually hiding some of the groups.

### `operator: "and" | "or"` {#operator}

_New in v1.1.0_

Whether to require all terms to appear in a page or any of them.

- `and`: All terms must appear in a page.
- `or`: Only one term must appear in a page. Addional terms will increase the score.

Default is `and`.

Example

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: { operator: "and" },
});
```

### `content: boolean` {#content}

Return stored content text with the search results. This is a protected query and
must be enabled in using the
[`allow_content`](/toml/options#allow_content) TOML option.

The content will be returned in the `content` field in `hit` objects of the search results.

Default is `false`.

Example

```ts
import {
	FindkitUI,
	html,
} from "https://cdn.findkit.com/ui/v1.1.0/esm/index.js";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	params: { content: true },
	slots: {
		Hit(props) {
			return html`${props.hit.content} `;
		},
	},
});
```
