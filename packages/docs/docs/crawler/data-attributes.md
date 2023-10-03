# Data Attributes

## `data-fdk-content` ${data-fdk-content}

Used for marking content for indexing.

Example

```html
<div class="content" data-fdk-content>
	I will be indexed.
	<div class="child">As will I.</div>
</div>
```

## `data-fdk-content-no-highlight` ${data-fdk-content-no-highlight}

Used for marking content for indexing in a way that it will not be shown in the search result highlight.

Example

```html
<div class="content" data-fdk-content-no-highlight>
	I will be indexed, but not returned in highlight
	<div class="child">As will I.</div>
</div>
```

## `data-fdk-skip` ${data-fdk-skip}

Used for marking content to be skipped from indexing.

Example

```html
<div class="skipped-content" data-fdk-skip>
	I wont be indexed.
	<div class="child">As wont I.</div>
</div>
```

## `data-fdk-tags` ${data-fdk-tags}

Used for marking content as tags. Several tags need to be space separated.

Example

```html
<div class="color-tags" data-fdk-tags>red blue green orange</div>
```

--> `tags: ["red", "blue", "green", "orange"]`

## `data-fdk-title` ${data-fdk-title}

Used for marking page title from HTML.

Example

```html
<h1 data-fdk-title>Page Title</h1>
```

## `data-fdk-superwords` ${data-fdk-superwords}

Used for marking superwords. For details see [docs](/crawler/meta-tag#superwords)
Several superwords need to be separated by spaces.

Example

```html
<div class="superwords" data-fdk-superwords>superman spiderman</div>
```

--> `superwords: ["superman", "spiderman"]`
