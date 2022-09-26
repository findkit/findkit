# Offset Modal

If you want to put the search input in your website header you can use the
Offset Modal pattern where the modal is just offsetted below the header. This is
implemented by binding an external input from the header to Findkit UI using the
[`.bindInput()` method](/ui/api/#bindInput), hiding the build-in one using the
[`Layout` slot](/ui/slot-overrides/slots#layout) and pushing the modal down with
a top offset.

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	css: `
		.findkit--modal-container {
			top: 100px;
		}
	`,
	slots: {
		Layout(props) {
			// Render the layout without the modal header
			// Eg. Only the props.content and not props.header
			return html`${props.content}`;
		},
	},
});

ui.bindInput("header input.search");
```

## Considerations

Since we are now hiding some of the build-in default behaviour we must ensure
the following is properly implemented:

- There's a close button
- The close button can be focused using keyboard
- Fetching status is indicated

These can be implemented using the methods and events exposed by the `FindkitUI`
instance like in the demo below or in the slot overrides.

## Caveats

Because we hard-code the header offset we must check that it works properly on
all screen sizes since the header height might be dynamic. Use media queries or
[ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
([demo](#resizeobserver)) etc. to tackle this. For more complex UI this might
get tricky. Another option is to use the [Content Overlay ](content-overlay)
pattern which is bit more involved to implement but it is not as hacky.

## Demos

## Fixed Height

<Codesandbox example="modal-offset" />

## ResizeObserver

<Codesandbox example="offset-modal-resize-observer" />
