# Worker Events

## `start(target)` {#start}

Emitted when a target crawl starts. The crawl is stopped if the handler throws
an error.

**Params**

- `context`
  - `host: string` The `host` entry defined in the toml file
  - `mode: string` The crawl mode (full, partial, manual, test)

**Return**: `Promise<void>`

Example

```ts
export default {
	async start(context) {
		console.log("Starting crawl on", context.host);
	},
};
```

## `end(target)` {#start}

Emitted when a target crawl end.

**Params**

- `context`
  - `host: string` The `host` entry defined in the toml file
  - `mode: string` The crawl mode (full, partial, manual, test)

**Return**: `Promise<void>`

Example

```ts
export default {
	async end(context) {
		console.log("Crawl completed for", context.host);
	},
};
```

## `fetch(request, context, next)` {#fetch}

Emitted on every request made by the crawler. Can be used to modify or skip the
outgoing request and the incoming response.

**Params**

- `request: Request` A Fetch API [Request][request] object
- `context`
  - `url: string` The request url
  - `mode: string` The crawl mode (full, partial, manual)
- `next: (request: Request) => Promise<Response>`

**Return**: `Promise<Response>` A Fetch API [Response][response] object

Examples

Modify the request

```ts
export default {
	async fetch(request, context, next) {
		request.headers.set("Authorization", "***");
		const response = await next(request);
		return response;
	},
};
```

Skip the network connection on certain URLs

```ts
export default {
	async fetch(request, context, next) {
		const url = new URL(request.url);

		// Hide robots.txt from the crawler
		if (url.pathname === "/robots.txt") {
			return new Response("not found", {
				status: 404,
			});
		}

		// Let other requests go out as normal
		return await next(request);
	},
};
```

## `html(page, context, next)` {#fetch}

Emitted when the crawler has parsed a 200 status HTML page to a DOM document.
Returns the result for indexing. Can be used to modify the result. For example
by adding tags, custom fields or clean up the title or content. It is also possible
to skip page from indexing by setting `status` to `"skipped"`. The `next()` call
executes the clean up selectors on the DOM document. So custom DOM operations should
be done before the `next()` call in order to have them to be executed in the original
DOM document.

**Params**

- `page`
  - `window`: Browser like Window object with [DOM document](https://developer.mozilla.org/en-US/docs/Web/API/Document)
- `context`
  - `url: string`
  - `request`: [Request][request]
  - `response`: [Response][response]
- `next`: `(page) => Promise<Result>`

**Return**: `Promise<Result>`

**Result**

- `status: "ok" | "skipped"` The value is `ok` when the page can be added to the index and `skipped` when not
- `url: string`
- `title: string` The title shown on the search results
- `content: string` Content used to index the page
- `language: string` Language of the page. Language analyzer is picked using this value
- `tags: string[]`
- `links: string[]` Links found on the page. Used with [`walk_links`](/toml/options#walk_links)
- `customFields: CustomFields` A [CustomFields](/crawler/meta-tag#customFields) object

Example

```ts
export default {
	async html(page, context, next) {
		const price = page.window.document.querySelector(".price")?.innerText;

		const result = await next(page);

		result.customFields.price = {
			type: "number",
			value: Number(price),
		};

		return result;
	},
};
```

## `pdf(pdf, context, next)` {#pdf}

Emitted when the crawler has parsed a PDF request with 200 status

**Params**

- `pdf`
  - `text(): Promise<string>`: Get the PDF content as a string
- `context`
  - `url: string`
  - `request`: [Request][request]
  - `response`: [Response][response]
- `next`: `(page) => Promise<Result>`

**Return**: `Promise<Result>`

**Result**

The result object is the same as in `html` event.

Example

```ts
export default {
	async pdf(pdf, context, next) {
		const result = await next(pdf);

		const url = new URL(context.request.url);

		if (url.pathname.startsWith("/docs")) {
			results.tags.push("docs");
		}

		return result;
	},
};
```

## `index(result, context, next)` {#fetch}

Emitted before the document is added to the index. Not called on test crawls.

Use cases

- Send the result to external systems using a custom `fetch()` call
- Skip indexing to the Findkit Index

**Params**

- `result: Result` Result returned from `html` or `pdf` event handlers
- `context`
  - `url: string` The request url
  - `mode: string` The crawl mode (full, partial, manual)
- `next: (request: Result) => Promise<Result>`

**Return**: The results object

[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
