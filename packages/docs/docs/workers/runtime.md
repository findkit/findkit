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

## Using npm modules

If you need to use a npm module you can use a bundler to include it
within your code. Just point the `workers = []` to the output bundle. We
recommend [esbuild][] for bundling. Use the ESM output format.

[esbuild]: https://esbuild.github.io/
