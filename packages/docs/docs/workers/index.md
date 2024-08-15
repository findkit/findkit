# Findkit Workers

Findkit Workers is a powerful way to modify how the crawler behaves. It allows
arbitrary JavaScript code to be executed within the crawler. The API is
inspired by Cloudflare Workers and uses Browser APIs such as the Fetch API and
DOM.

Read the [announcement blog post](https://www.findkit.com/announcing-findkit-workers/) for an overview
and list of example use cases.

## Example

A simple Findkit Worker looks like this:

```ts
// my-worker.js
// Workers are ESM modules with a default export
export default {
	// The worker can have one or more handlers
	async fetch(request, context, next) {
		// The fetch handler allows you to hook into every http request the
		// crawler sends out. The request and response objects implement
		// the WHATWG Fetch Standard aka the Fetch API
		console.log("Worker running in ", request.url);

		// You can modify the request before it is sent
		request.headers.set("Authorization", "***");

		// The fetch handler is invoked as a middleware. Calling next() passes
		// the request to the next worker and on the last worker the request is
		// made and it returns the response.
		const response = await next(request);

		// Finally return the response. Possibly modifying it too.
		// It is also possible to skip next() completely and to just return a
		// custom response without making a network connection.
		return response;
	},

	async html(page, context, next) {
		// The html hanlder is invoked for all 200 status text/html responses where
		// the response html is parsed to DOM.

		// The `page.window` property is like the `window` object in a browser
		// but instead of being global it is just a local variable
		const price = page.window.document.querySelector(".price")?.innerText;

		const result = await next(page);

		// Modify the result by adding a custom field https://findk.it/custom-fields
		result.customFields.price = {
			type: "number",
			value: Number(price),
		};

		return result;
	},
};
```

## Testing and deployment

Add this to a `my-worker.js` file next to the `findkit.toml` file and add `workers`
entry to the `[[targets]]` section:

```toml
id = "..."

[[targets]]
host = "example.com"
workers = ["my-worker.js"]
```

And now you can test the worker by running a test crawl

```
findkit crawl test "https://example.com/page"
```

Once everything is ok, you can deploy it

```
findkit deploy
```

Add it will be executed within all crawl types: Full, partial and manual.

To remove the worker just remove the `workers` entry and run deploy again.

## Middleware

Most worker handlers are executed in a "middleware stack" meaning you can define
multiple workers where the first worker passes the value to the next one using
the `next()` function

```toml
workers = ["worker-a.js", "worker-b-js"]
```
