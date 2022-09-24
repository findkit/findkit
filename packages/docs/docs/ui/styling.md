# Styling

Findkit UI uses Shadow DOM to avoid conflicting CSS styles. This means
that if you want to customize the styles you cannot just target the
class names directly in your stylesheets. You must add the styles inside
the Shadow Root or disable the Shadom DOM.

## Adding Styles inside the Shadow Root

Just pass the custom CSS in the `css` option.

```ts
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// highlight-start
	css: `
        /* Reveal the backdrop */
        .findkit--modal {
            position: fixed;
            width: initial;
            inset: 1rem;
        }
    `,
	// highlight-end
});
```

## Disabling Shadow DOM

If you want to use your existing stylesheets when you can just disable the
Shadow DOM creation in `FindkitUI` with `shandowDom: false` option:

```ts
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// highlight-next-line
	shadowDom: false,
});
```

But do note that this can cause unexpected styles to leak in the `FindkitUI` if
you have used plain element selectors like `h1 { ... }` in your website styles.
