---
sidebar_position: 9
---

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

### `title: string`

The crawler reads the title from the `<title>` tag but this field can used
provide different title.

### `tags: string[]`

List of additional [tags](/crawler/tagging) to index the page with.

### `showInSearch: boolean`

When set to false the crawler won't index the page.

### `created: string`

Page creation date as ISO 8601 string

### `modified: string`

Page modification date as ISO 8601 string
