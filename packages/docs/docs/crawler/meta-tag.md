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
