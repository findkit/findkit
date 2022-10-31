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
select the text content from all elements with it and combine them to the page
index. You can use the `findkit inspect <url>` CLI command to view currently indexed content
and `findkit crawl test <url>` to see what content would be selected to the index.

## Custom CSS Selector

If you cannot add the data attributes you can use the `content_selector` field
in the `findkit.toml` to select content using CSS selectors.

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
want to index. These elements can be removed from indexed content with the skip data attribute
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
