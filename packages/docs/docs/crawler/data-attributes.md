# Data Attributes

The crawler automatically recognizes following data attributes in the page HTML.

## `data-fdk-content` {#data-fdk-content}

Used for marking content for indexing. When at least one `data-fdk-content` is
present on the page the automatic content selection in the crawler will be
disabled and the content will be picked only from the elements with the
attribute.

Example

```html
<main>
    <div data-fdk-content>
        I will be indexed.
        <div>As will I.</div>
    </div>

    <p>
    I won't be indexed because containing element or any of its parents does
    not have the data-fdk-content attribute
    </p>
</main>
```


## `data-fdk-content-no-highlight` {#data-fdk-content-no-highlight}

Used for marking content for indexing in a way that it will not be shown in the
search result highlight. If you don't wan't to text to appear on the page use
the [`contentNoHighlight`](/crawler/meta-tag#contentNoHighlight) meta tag field
instead. Hidden elements can harmful for Google SEO because
[it may be interrepted as
spam](https://developers.google.com/search/docs/essentials/spam-policies#hidden-text-and-links).

Example

```html
<div data-fdk-content-no-highlight>
	I will be indexed, but not returned in the result highlight
</div>
```

## `data-fdk-skip` {#data-fdk-skip}

Used for marking content to be skipped from indexing.

Example

```html
<div data-fdk-skip>
	I wont be indexed.
	<div>As won't I.</div>
</div>
```

It can also exclude content from `data-fdk-content` elements

```html
<div data-fdk-content>
	I will be indexed.
	<div data-fdk-skip>But I won't be</div>
</div>
```

## `data-fdk-tags` {#data-fdk-tags}

Used for marking content as tags. Several tags need to be space separated.

Example

```html
<div data-fdk-tags>red blue green orange</div>
```

Would equal to a meta tag with `tags: ["red", "blue", "green", "orange"]`

## `data-fdk-title` {#data-fdk-title}

Used for marking page title from HTML.

Example

```html
<h1 data-fdk-title>Page Title</h1>
```

## `data-fdk-superwords` {#data-fdk-superwords}

Used for marking superwords. For details see [docs](/crawler/meta-tag#superwords)
Several superwords need to be separated by spaces.

Example

```html
<div data-fdk-superwords>superman spiderman</div>
```

Would equal to a meta tag with `superwords: ["superman", "spiderman"]` 
