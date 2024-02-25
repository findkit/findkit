# Export

It is possible to export all the indexed data using the Findkit CLI. Just run
`findkit export` in a directory with the `findkit.toml` file or explicitly pass
the project id (public token):

```
findkit export --project <public token>
```

The command will generate a [JSON Lines](https://jsonlines.org/) file where each line is a JSON
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

## Parsing JSON Lines

JSON Lines is used because it can be streamed directly from the index since index sizes can be very
large, but not all tool can read JSON Lines natively. Fortunately reading JSON Lines
is just matter of reading the exported file line by line and parsing each line
with a standard JSON parser.

## Converting to JSON

If you need a standard JSON file of the export you can use [jq](https://jqlang.github.io/jq/)
to convert it to a standard JSON:

 `-s`

```
jq -s '{pages: [.[]]}' findkit-export-[ID].jsonl
{
    "pages": [ {...}, {...}, ... ]
}
```

This will convert the JSON Lines to be in an array in a `pages` key.
