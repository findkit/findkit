# Raw Embedding

Raw embedding can be used when you want the search UI to be part of the page
content. This often used for the more custom search interfaces, some times
called "archive views" like an event or product listing with custom filters.

This pattern can be used together with the modal patterns. For example a modal
pattern can be used for the global site search and raw embeding for the more
specific use cases.

It can be implement by setting [`modal: false`](/ui/api/#modal) and passing in a
custom container to the [`container`](/ui/api/#container) option. This just
renders the UI into the container without any modal behaviour such as focus
trapping or container scrolling.

```ts
const ui = new FindkitUI({
	publicToken: "p68GxRvaA",
	// highlight-start
	container: ".findkit-container",
	// highlight-end
	instanceId: "my",
	minTerms: 0,
	infiniteScroll: false,
	header: false,
});
```

## Considerations

- If you have other `FindkitUI` instances, for example another one using the modal
  embedding pattern, you must pass in [`instanceId`](/ui/api/#instanceId) to avoid
  conflicts
- You may want to disable the automatic result loading on scroll with
  [`infiniteScroll: false`](/ui/api/#infiniteScroll) to allow users to reach the
  footer.
- Add fetching indicator

## Demo

<Codesandbox example="static/raw-embed" />
