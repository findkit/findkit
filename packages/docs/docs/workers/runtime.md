# Worker Runtime

Findkit Workers is a custom V8 runtime which implements few browser APIs.

We use a recent version of V8 meaning most modern Javascript features are
available but it should be noted that the runtime is not Node.js or a
web browser. So there's no `require()`, import or any other Node.js APIs available. Also it
does not execute the Javascript present on the web pages. Only the code you
provide is executed.

## Javascript API

In addition to standard Javascript APIs present in V8 the runtime has following
browser APIs:

- Partial [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
  - [fetch()][fetch], [Request][], [Response][], [Headers][]
  - Not all Fetch API features are supported but we are working on adding more
  - If you hit any limitations please [contact us](https://www.findkit.com/contact/) so we known what to prioritize, thanks!
- [URL][] and [URLSearchParams][]
- [URLPattern][]
- [btoa][] and [atob][]
- [AbortSignal][] and [AbortController][]
- [TextEncoder][] and [TextDecoder][]
- [structuredClone][]

[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[Request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[Headers]: https://developer.mozilla.org/en-US/docs/Web/API/Headers
[URL]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[URLSearchParams]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
[btoa]: https://developer.mozilla.org/en-US/docs/Web/API/btoa
[atob]: https://developer.mozilla.org/en-US/docs/Web/API/atob
[AbortSignal]: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
[AbortController]: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
[TextEncoder]: https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
[TextDecoder]: https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
[structuredClone]: https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
[URLPattern]: https://developer.mozilla.org/en-US/docs/Web/API/URLPattern

## Worker DOM

In the [`html`](/workers/events#html) Worker event you get access to a brower like
`window` object which contains `document` with `.querySelector()`, `.innerText` and
other common DOM APIs. This DOM implementation is not full browser DOM but a subset
for Findkit Workers. For example it does not execute `<script>` tags or intrepret
CSS styles.

### `.innerText` {#innerText}

The `innerText` property available on `Element` nodes is the way to extract
text for indexing. Findkit Crawler internally uses this too.
It will generate line breaks between block level elements but not
for between inline elements.

For example `<div>hello<span>world</span></div>` will have `innerText` of `hello\nworld` and
`<span>hello</span><span>world</span>` will have `innerText` of `helloworld`. The caveat is
that it does not regonize CSS defined `display` property. So it is important to use semantically
correct HTML elements on the page.

If it is not possible to use real block elements you may use the Worker DOM API to manually add
spaces or line breaks between elements.

### Cleanup selector

The [`cleanup_selector`](/toml/options/#cleanup_selector) actually removes the matched elements
from the DOM. So when the worker code needs to access these elements be sure to read the DOM
before calling `next()`

With following config

```toml
cleanup_selector = ".price"
```

```js
export default {
	async html(page, context, next) {
	   // Read the dom before `next()`
		const price = page.window.document.querySelector(".price")?.innerText;

		// The cleanup_selector removes the elements here
		const result = await next(page);

		// The .price is not available anymore

		return result;
	},
};
```


## Using npm modules

If you need to use a npm module you can use a bundler to include it
within your code. Just point the `workers = []` to the output bundle. We
recommend [esbuild][] for bundling. Use the ESM output format.

[esbuild]: https://esbuild.github.io/
