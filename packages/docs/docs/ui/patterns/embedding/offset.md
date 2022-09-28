# Offset Modal

If you want to put the search input in your website header you can use the
Offset Modal pattern where the modal is just offsetted below the header. This is
implemented by binding an external input from the header to Findkit UI using the
[`.bindInput()` method](/ui/api/#bindInput), hiding the build-in one using the
[`header` option](/ui/api/#header) and pushing the modal down with
a top offset.

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	// We use the site header so no need for the build-in one
	header: false,
	css: `
		.findkit--modal-container {
			top: 100px;
		}
	`,
});

ui.bindInput("header input.search");
```

## Considerations

Since we are now hiding some of the build-in default behaviour we must ensure
the following is properly implemented:

- There's a close button
- The close button can be focused using keyboard
- Search fetch status is indicated
- Lazy loading status is not actually that important because it can load in the
  background while the user types search terms

These can be implemented using the methods and events exposed by the `FindkitUI`
instance like in the demo below or in the slot overrides.

## Caveats

Because we hard-code the header offset we must check that it works properly on
all screen sizes since the header height might be dynamic. Use media queries or
[ResizeObserver][resizeobserver] etc. to tackle this.
For more complex UI this might get tricky. Another option is to use the [Content
Overlay ](content-overlay) pattern which is bit more involved to implement but
it is not as hacky.

### ResizeObserver

We can use a [ResizeObserver][resizeobserver] to monitor the header height,
sync it to a CSS variable and use it as the top offset. See the [demo
below](#resizeobserver-demo).

```ts
const ui = new FindkitUI({
	publicToken: "<TOKEN>",
	header: false,
	css: `
		.findkit--modal-container {
			/* dynamically updating header height */
			top: var(--top-offset);
		}
	`,
});

ui.events.on("open", (e) => {
	// Start monitoring the header height when the modal is opened
	const observer = new ResizeObserver((entries) => {
		const height = entries[0].borderBoxSize[0].blockSize;
		// Expose the height as CSS variable to the Findkit UI container
		e.container.style = `--top-offset: ${height}px`;
	});

	observer.observe(document.querySelector("header"));

	// Stop monitoring when the modal is closed.
	ui.events.once("close", () => {
		observer.disconnect();
	});
});
```

## Demos

### Fixed Height

<Codesandbox example="static/modal-offset" />

### ResizeObserver Demo

<Codesandbox example="static/offset-modal-resize-observer" />

[resizeobserver]: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
