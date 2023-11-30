# Export

It is possible to export all the indexed data using the Findkit CLI. Just run
`findkit export` in a directory with the `findkit.toml` file or explicitly pass
the project id (public token):

```
findkit export --project <ID>
```

The command will generate a "JSON Lines" file where each line is a JSON
document representing a crawled page.

## Format

In TypeScript terms each line has a following type

```ts
interface Page {
	id: string;
	url: string;
	status: string;
	docs: Doc[];
}

interface Doc {
	id: string;
	url: string;
	title: string;
	tags: string[];
	content: string;
	language: string;
	superwords: string;
	noHighlightContent: string;
	customFieds: {
		[key: string]: {
			type: "keyword" | "number" | "date";
			value: string;
		};
	};
}
```

Note that each page may generate multiple documents to the index but on normal
setup each page corresponds just to a single document.

## Transforming

You may simplify the format with [jq](https://jqlang.github.io/jq/):

```
jq '.docs[0]' findkit-export-[ID].jsonl
```

or if you want to convert the JSON Lines to JSON array use `-s`

```
jq -s '{docs: [.[].docs[0]]}' findkit-export-[ID].jsonl
{
    "docs": [ {...}, {...}, ... ]
}
```

or pick only some of the keys

```
jq -s '{docs: [.[].docs[0] | {title, url} ]}' findkit-export-[ID].jsonl
{
    "docs": [
        {"title": "", url": ""},
        {"title": "", url": ""},
        ...
    ]
}
```
