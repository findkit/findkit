# Content Overlay

The Content Overlay Pattern is used achieve the same result as the [Offset Modal
Pattern](offset) where the input is placed in the website header element
but instead of absolutely positioning the modal with hand picked top offset the
search UI is placed in the content element where it overlays the content.
This is more robust because the search UI can just fill the area given to it but
this can be bit more involved to implement dependening on your website layout.

This is implemented by passing a custom container element to `FindkitUI`
instance using the [`container` option](/ui/api/#container). This container is
stretched to overlay the content when the Finkit UI is opened. The open state
can be detected in CSS using the `findkit-ui-open` class which is added to the
body element when the UI is open. See the demo below for full details.

```css
.findkit-ui-open .findkit-overlay-container {
	position: absolute;
	inset: 0;
}

/* The parent container must have position:relative;
   for position:absolute; to stretch correctly */
.content {
	position: relative;
}
```

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// highlight-next-line
	container: ".findkit-overlay-container",
	css: `
		.findkit--modal-container {
			position: sticky;
		}
	`,
});

ui.bindInput("header input.search");
```

## Considerations

The considerations are the same as with the [Offset
Modal Pattern](offset#considerations): Close button, focus trapping, fetch
status etc. But also you should check that the modal is resized correctly when
the page content or search results do not fill the viewport 100%.

## Demo

<Codesandbox example="content-overlay" />
````
