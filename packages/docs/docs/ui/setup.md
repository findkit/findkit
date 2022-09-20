---
sidebar_position: 1
---

# Setup

The simplest way to setup the user interface is to just import it from our
CDN in a module script tag and bind to a button you want to open it from:

```html
<script type="module">
	import { FindkitUI } from "https://cdn.findkit.com/ui/v0.0.1/esm/index.js";
	const ui = new FindkitUI({ publicToken: "<TOKEN>" });
	ui.openFrom("button.open-search");
</script>
```

You can find the `publicToken` using the `findkit status` command or from the
project page on the Hub.

This script can be placed any where on the website.

Try it on Codesandbox:

https://codesandbox.io/s/github/findkit/findkit/tree/main/packages/ui-examples/simple

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
will be using the npm import but I can be replaced with CDN import if you cannot
use the npm import.

## Demo

Checkout the "Demo UI" view on the Hub to quickly see how it works on your
project. This documentation site uses it as well. You can checkout [its
configuration on Github](https://github.com/findkit/findkit/blob/main/packages/docs/src/theme/SearchBar.tsx).

## Open Source

The library is open source and is available on Github
<https://github.com/findkit/findkit/tree/main/packages/ui>
