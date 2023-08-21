# Fetch Lib

Low level read-only API for Findkit indices used in Findkit UI. The API is
unstable ATM.

## Install

```
npm install @findkit/fetch
```

## Usage

```ts
import { createFindkitFetcher } from "@findkit/fetch";

const fetcher = createFindkitFetcher({
	publicToken: "<TOKEN>",
});

const result = await fetcher.fetch({
	terms: "test",
	// Groups of Search Params
	// https://docs.findkit.com/ui/api/params/#params
	// https://docs.findkit.com/ui-api/ui.searchparams/
	groups: [
		{
			// Match any tag
			// https://docs.findkit.com/ui/api/params/#tagQuery
			tagQuery: [],
		},
	],
});

for (const group of result.groups) {
	// Hit https://docs.findkit.com/ui-api/ui.searchresulthit/
	for (const hit of group.hits) {
		console.log(hit.title, hit.url, hit.tags);
	}
}
```
