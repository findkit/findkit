# Indexing Content

A very important part of making a good search experience is to select only the
relevant content for indexing. Eg. avoid adding text which is repeated on
multiple pages like menus, footers etc.

## Data Attribute

If you are just building the site you should just mark the content right in the
html to be indexed using the `data-fdk-content` data attribute.

Example

```html
<div class="content" data-fdk-content>The content text...</div>
```

You can use the attribute multiple times on a single page. The crawler will
extract the text content from all elements with it and combines them to the page
index. You can use the `findkit inspect <url>` and `findkit crawl test <url>`
CLI commands to see what the content is actually selected to the index.

## Custom CSS Selector

If you cannot add the data attributes you can use the `content_selector` field
in the `findkit.toml` to select content using CSS selector.

Example

```toml
[[targets]]
host = "example.com"
# highlight-next-line
content_selector = ".content, .post"
```

You can define multiple selectors by separating them with commas. If multiple
elements are matched the content is indexed from all of them.

## Cleaning Content

Sometimes the selected content can contain some inner elements that you don't
want to have indexed. These can be cleaned up with the skip data attribute
`data-fdk-skip` or the clean up selector.

```html
<div class="content" data-fdk-content>
	The content text...
	<div class="author-bio" data-fdk-skip>
		Author bio that is also on the dedicated author page.
	</div>
</div>
```

or in the `findkit.toml`

```toml
[[targets]]
host = "example.com"
content_selector = ".content, .post"
# highlight-next-line
cleanup_selector = ".author-bio"
```

## Title selector

Findkit tries to determine page title automatically using default selectors,
but its behaviour can be customized via options listed below.

Default title selectors in the order of importance:

- findkit data-attribute 'data-fdk-title'
- `<meta og:title></meta>` element
- `<title></title>` element

### Meta tag

Title can be defined directly in page [meta](/crawler/meta-tag#title)

### Meta tag CSS-selector

Title CSS-selector can be passed in page [meta](/crawler/meta-tag#titleSelector)

### Data attribute

Title can be defined with default data-attributes.

```html
<h1 data-fdk-title>Custom Title</h1>
```

### CSS-selector in findkit.toml

You can pass CSS-selector in findkit.toml. First elements content matching the selector is chosen as title.

Example

```toml
[[targets]]
host = "example.com"
# highlight-next-line
title_selector = "h1"
```

## Modifying selected title

After choosing the title, the title can be modified using one of the options below.

### Meta tag titleSelectorRegex

Chosen title can be modified with regex defined in page [meta](/crawler/meta-tag#titleSelectorRegex)

### Config title_selector_regex

Chosen title can be modified with regex defined in findkit.toml

Example

```html
<h1>Title - Unwanted</h1>
```

```toml
[[targets]]
host = "example.com"
# highlight-next-line
title_selector = "h1"
# highlight-next-line
title_selector_regex = "([^ ]+)"
```
