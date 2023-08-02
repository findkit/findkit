# Indexing Content

A very important part of making a good search experience is to select only the
relevant content for indexing. Eg. avoid adding text which is repeated on
multiple pages like menus, footers etc.

:::tip
Findkit crawler automatically extracts the relevant page content but for
production use cases it is recommended to explicitly select the relevant content
for indexing with following methods.
:::

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

## Title Selector

Findkit tries to determine page title automatically using default selectors,
but its behaviour can be customized via options listed below.

Default title selectors in the order of importance:

- findkit data attribute `data-fdk-title`
- `<meta og:title></meta>` element
- `<title></title>` element

### Meta Tag

Title can be defined directly in page [meta](/crawler/meta-tag#title)

### Meta tag CSS Selector

Title CSS-selector can be passed in page [meta](/crawler/meta-tag#titleSelector)

### Data Attribute

Title can be defined with default data attributes.

```html
<h1 data-fdk-title>Custom Title</h1>
```

### CSS Selector in findkit.toml

You can pass CSS selector in findkit.toml. First elements content matching the selector is chosen as title.

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

## Skipping Pages

Your website might include pages that you do not want to be
included in the search index. For this purpose you can use one of the
options listed below

### Robots.txt

Place `/robots.txt` to website root.
For more info refer to [documentation](https://developer.mozilla.org/en-US/docs/Glossary/Robots.txt).

You can instruct Findkit Crawler to not to respect `/robots.txt` rules with [respect_robots_txt](/crawler/toml#respect_robots_txt) configuration option.

### Meta Robots Tag

By placing robots meta tag on an individual page you can instruct crawlers, findkit included,
to not index the page or not to follow links on the page.

For more information see Google's [documentation](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

You can instruct Findkit Crawler to not to respect robots meta rules [respect_robots_meta](/crawler/toml#respect_robots_meta).

### Deny Patterns {#deny_patterns}

You can define patterns for crawler to skip in `findkit.toml`.
Patterns can be strings or regexes in string staring with `reg:`. Regexes need to be written as strings without the encapsulating `//`

Strings are matched to start of any [URL pathname](https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname).
Regular Expression patterns are matched against the whole URL pathname.

You can define as many deny patterns as you need, but there are better options available for skipping individual urls.

Example deny pattern string:

```toml
[[targets]]
host = "example.com"
content_selector = ".content, .post"
# highlight-next-line
deny_patterns = ["/secret/"]
```

Would cause crawler to skip:

- `example.com/secret/`
- `example.com/secret/first_secret`
  But would not skip:
- `example.com/secret` extraneous `/` at the end of deny pattern
- `example.com/some_folder/secret/` deny pattern is matched against the start of the URL pathname

Example deny pattern regular expression:

```toml
[[targets]]
host = "example.com"
content_selector = ".content, .post"
# highlight-next-line
deny_patterns = ["reg:/secret"]
```

Would cause crawler to skip:

- `example.com/secret`
- `example.com/secret/`
- `example.com/secret/first_secret`
- `example.com/some_folder/secret/`
- `example.com/some_folder/secret/first_secret`
- `example.com/secretariat/big_red`
