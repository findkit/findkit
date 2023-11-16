# Styling

Findkit UI uses following techniques for the CSS it provides:

- CSS class names are prefixed with `findkit--`
- The HTML elements are rendered into a Shadow DOM
- The CSS is added into a CSS Layer `findkit`

## Shadow DOM {#shadow-dom}

Shadow DOM prevents the page styles intefering with the elements created by
Findkit UI. This means you cannot directly target Findkit UI elements with your
CSS stylesheets. You must add the styles inside the Shadow DOM or disable the
Shadow DOM creation.

### Adding Styles inside the Shadow DOM

Just pass the custom CSS in the `css` option.

```ts
import { FindkitUI, css } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// highlight-start
	css: css`
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

### Disabling Shadow DOM

If you want to use your existing stylesheets you can just disable the Shadow DOM
creation in `FindkitUI` with [`shadowDom: false`](/ui/api/#shadowDom) option:

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

## CSS Layers {#css-layers}

_New in v0.13.0_

The build-in styles are added to a nested `findkit.core` CSS Layer and any
custom styles passed to the `css` option are added to a `findkit.user` layer
which becomes after core layer. If you cannot work with CSS Layers you can
disable them with the [`cssLayers: false`](/ui/api/#cssLayers) option.

If you use CSS Layers in your own code you should order the layers in a way
that your CSS layer comes after the `findkit` layer so it can override the
Findkit UI Styles:

```
@layer findkit, mystyles;
```

:::tip
CSS Layers tl;dr

They help with CSS selector specicifity. Any CSS that is not in a CSS Layer or
is in a latter layer is automatically more specific than the CSS in former
layers regardless of any specicifity rules. Read more on
[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer).
:::

## CSS Variables {#css-variables}

FindkitUI uses native CSS variables for styling. The variables are also
prefixed with `findkit--`.

Here's an example of the most important customization you'll want to do: Set
the brand color to match your site:

```ts
import { FindkitUI, css } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	css: css`
		.findkit--container {
			--findkit--brand-color: olive;
		}
	`,
});
```

_The `findkit--container` class was added in v0.7.0 otherwise you can use `:root, :host {}` instead._

For all available CSS Variables see
[`global.css`](https://github.com/findkit/findkit/blob/main/packages/ui/styles/global.css)
in the FindkitUI source code.
