# Fullscreen Modal

The Fullscreen Modal Pattern is easiest and the safest way to embed Findkit UI
on a website. You don't need to worry about how it fits on your page since it is
just overlayed on top of it. The containing element is automatically created and
appended to the body element.

It is "safe" in the sense that it is accessible and will not conflict with the
existing styles. More custom solutions may require additional care to ensure
proper accessibility and styling.

```ts
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
});

ui.openFrom("button#open");
```

## Considerations

On slow networks it might take a moment for the UI to lazy load. You should add
a visual indication when the UI opening is requested.

This can be done using the [`loading` events](/ui/api/events#loading).

```ts
const button = document.querySelector("button.open");

ui.on("loading", () => {
	button.classList.add("loading");
});

ui.on("loading-done", () => {
	button.classList.remove("loading");
});
```

## Demo

<Codesandbox example="static/simple" />
