# Fragment Pages

:::caution
This feature is in preview and not yet available for all organizations.
:::

Fragment Pages is a way to generate multiple pages to the index from a single HTML page using [Findkit Workers](/workers/).

Fragment refers to the part of the URL after the hash (#) symbol. For example, in the URL `https://example.com/page#fragment`, the fragment is `fragment`.
The fragment pages always have the fragment in their url.

The fragments are generated inside the [`html`](/workers/events/#html) worker event. Each fragment must have an `id`, `title` and `content` fields.
They can also have [subset of the meta tag fields](#metatag).

## Simple Example

Here's a simplest possible worker for adding fragments.

```js
export default {
	async html({ window }, { request }, next) {
		const res = await next();

		res.fragments.push({
			id: "a-fragment",
			title: "A fragment",
			content: "Some content",
		});

		return res;
	},
};
```

It just adds a single static fragment for every page.

For real use cases you'll want to check `request.url` that you are on a page you want to add fragments to, and generate fragments based on the page document `window.document`.

## Testing

Use the Findkit CLI to run [test crawls](/crawler/testing-crawls) to see how the fragments are generated.

```sh
findkit crawl test "https://docs.findkit.com/workers/events/"
```

## Staff Directory Example

Let's image following staff listing page

```html
<div id="john" class="employee">
	<div class="name">John Doe</div>
	<div class="title">Marketing</div>
	<div class="email">john@example.com</div>
</div>
<div id="jane" class="employee">
	<div class="name">Jane Doe</div>
	<div class="title">Developer</div>
	<div class="email">jane@example.com</div>
</div>
```

To generate fragments for each employee, you can do following:

```js
export default {
	async html({ window }, { request }, next) {
		const { pathname } = new URL(request.url);

		// Only interested in the /staff page
		if (pathname !== "/staff") {
			return await next();
		}

		const fragments = Array.from(
			window.document.querySelector(".employee"),
		).map((el) => {
			return {
				id: el.id,
				title: el.querySelector(".name")?.innerText,
				content: el.querySelector(".title")?.innerText,
				tags: ["employee"],
				customFields: {
					email: {
						type: "email",
						value: el.querySelector(".email")?.innerText,
					},
				},
			};
		});

		// Important! Extract fragments before other
		// workers manipulate the document
		const res = await next();

		res.fragments = fragments;

		return res;
	},
};
```

This would add following urls to the index

- `https://example.com/staff#john`
- `https://example.com/staff#jane`

## Fragments by headings

It is also possible to generate fragments from heading elements. It's bit more involved. This documentation site generates
fragments for the `<h3>` elements. Checkout the code here:

https://github.com/findkit/findkit/blob/main/packages/docs/workers/docs.js

## Meta Tag {#metatag}

Fragments support following subset of the Meta Tag values in the object definition

- [`title`](/crawler/meta-tag#title)
- [`customFields`](/crawler/meta-tag#customFields)
- [`superwords`](/crawler/meta-tag#superwords)
- [`contentNoHighlight`](/crawler/meta-tag#contentNoHighlight)
- [`tags`](/crawler/meta-tag#tags)
    - All fragments will automatically get the `fragment`, `domain/${domain}` and `language/${language}` tags
- [`language`](/crawler/meta-tag#tags)
    - The language tag is automatically set to the language of the parent page but it can be overridden
      if the page is authored in a multiple languages
    - Tip: The [`lang`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang) attribute can be added to any HTML element, not just the `<html>` element.


## Parent Page

When the fragments array is non-zero the page itself will not be indexed. If you need to have it indexed as well
you can index is it as the `top` fragment

```js
const res = await next();

res.fragments.push({
	id: "top",
	title: res.title,
	content: res.content,
	tags: res.tags,
	customFields: res.customFields,
});
```

## Removing Fragment Pages

The fragment pages in the index follow the parent page: When the parent page responds with a 404 status code, the fragment pages are removed from the index too.

When subsequent crawls generate different set of fragments, the old fragments will be removed from the index.
