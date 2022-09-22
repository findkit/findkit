# Disable CDN

As described in the [Technical Description](/ui/tech) `@findkit/ui` lazy loads
the implementation code from our CDN even installing it from the npm package but
there are few cases where you might want to disable this:

- When [contributing](https://github.com/findkit/findkit/tree/main/packages/ui#readme) to `@findkit/ui` code
  - You cannot make test installations since the code of the test builds are
    not uploaded to our CDN.
- If you need to run fork of `@findkit/ui`
- You just cannot connect to `cdn.findkit.com` from a internal network.
- Developing offline

## Code

Here's how to skip the CDN usage:

```ts
import { FindkitUI } from "@findkit/ui";
import * as implementation from "@findkit/ui/implementation";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	async load() {
		return implementation;
	},
});
```

but this also disables the lazy loading since the code is now included in the
bundle. If your bundler supports the dynamic `import()` you can import them
lazily in the `load()` handler:

```ts
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	async load() {
		return import("@findkit/ui/implementation");
	},
});
```
