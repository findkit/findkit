# Setup

The simplest way to setup the user interface is to just import it from our
CDN in a module script tag and bind to a button you want to open it from:

```html
<script type="module">
	import { FindkitUI } from "https://cdn.findkit.com/ui/v0.0.1-dev.19c6e48951/esm/index.js";
	const ui = new FindkitUI({ publicToken: "<TOKEN>" });
	ui.openFrom("button.open-search");
</script>
```

You can find the `publicToken` using the `findkit status` command or from the
project page on the Hub. The script can be placed any where on the website.
This creates a simple fullscreen modal of the UI but there are many other
[embedding patterns](/ui/patterns/embedding/) for different use cases.

## npm

If you are using a bundler such as Webpack you can also install it from npm:

```
npm install @findkit/ui
```

```ts
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({ publicToken: "<TOKEN>" });

ui.openFrom("button.open-search");
```

This removes one network request from your website and gives type-safety if you
are using Typescript as well.

The CDN and npm imports are completely interchangeable. In this documentation
will be using the npm import but it can be replaced with the CDN import.

## Try it!

<Codesandbox example="static/simple" />
