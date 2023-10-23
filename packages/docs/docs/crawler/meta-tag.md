# Meta Tag

The meta tag is way to pass instructions to the crawler on per page basis.

It is a `script` tag with `"findkit"` id and type of `application/json`:

```html
<script id="findkit" type="application/json">
	{
		"title": "Page title",
		"tags": ["custom-tag1", "custom-tag2"]
	}
</script>
```

The tag should be placed inside the `<head>` tag.

:::caution
You must sanitize the strings in the JSON if it comes from an untrusted souce.
[See this](https://security.stackexchange.com/a/254386/155284).
:::

:::tip
If you are using WordPress you should use our [WordPress
Plugin](https://github.com/findkit/wp-findkit) to generate this tag.
:::

## Fields

### `title: string` {#title}

The crawler reads the title from the `<title>` tag but this field can used
provide different title.

### `titleSelector: string` {#titleSelector}

Title can be selected with passed CSS selector.

### `titleSelectorRegex: string` {#titleSelectorRegex}

Title can cleaned up with with a regex.
The first caputre group will be used as the title.

Example

```html
<script id="findkit" type="application/json">
	{
		"title": "Page Title - Unwanted",
		"titleSelectorRegex": "(.+) -.*"
	}
</script>
```

will pick `Page Title` as the title.

### `contentSelector: string` {#contentSelector}

Use custom CSS selector to select the content on this page. This will be
combined with the [`content_selector`](/toml/#content_selector) TOML
option.

### `contentNoHighlight: string` {#contentNoHighlight}

Add text to the index that is searchable but not highlighted on the result
excerpts. Commonly used to add synonyms and other content that is not part of
the main content text.

### `contentNoHighlightSelector: string` {#contentNoHighlight}

CSS selector used to get value for [`contentNoHighlight`](#contentNoHighlight)
from the page. This will be combined with the
[`content_no_highlight_selector`](/toml/options#content_no_highlight_selector) TOML
option.

### `tags: string[]` {#tags}

List of additional [tags](/crawler/tagging) to index the page with.

### `showInSearch: boolean` {#showInSearch}

When set to false the crawler won't index the page.

### `created: string` {#created}

Page creation date as ISO 8601 string

### `modified: string` {#modified}

Page modification date as ISO 8601 string

### `superwords: string[]` {#superwords}

Add "superwords" to the indexed document. When a search keyword matches a
superword the matching search result score will get a boost that will be always
bigger than normal results. This can be used to implement "Pinned Results" that
are always shown before other results. Superwords are not included in search
highlights.

On match `superwordsMatch: true` will be added to the response hit object which can be used to style the superword
matches. FindkitUI will automatically add a `findkit--superwords-match` class
to the result hit container element. See [`Hit`
slot](/ui/slot-overrides/slots#hit) for more advanced search result
customizations.

### `language: string` {#language}

Two letter language code. If longer code is given it will be sliced to first to
two letters. Eg. `en_US` => `en`.

This is used to index the text with a language specific analyzers.

If not defined the language is picked up from the `<html lang>` attribute. If
no explicit language is found at all, a natural language detection algorithm is
executed on the text.

### `customFields: object` {#customFields}

Add custom fields to the indexed document which will be returned within the
search results. See [Custom Fields in Slot
Overrides](/ui/slot-overrides/custom-fields/).

Following types are available:

- `keyword`: Plain string
- `number`: A number
- `date`: ISO 8601 formated date string

In TypeScript terms the `customFields` format is

```ts
type CustomFields = {
	[customField: string]:
		| { type: "date"; value: string }
		| { type: "keyword"; value: string }
		| { type: "number"; value: number };
};
```

Example

```html
<script id="findkit" type="application/json">
	{
		"customFields": {
			"thumbnail": {
				"type": "keyword",
				"value": "https://example.com/image.jpg"
			},
			"price": {
				"type": "number",
				"value": 10
			},
			"eventStarts": {
				"type": "date",
				"value": "2022-10-03T12:18:52.233Z"
			}
		}
	}
</script>
```
