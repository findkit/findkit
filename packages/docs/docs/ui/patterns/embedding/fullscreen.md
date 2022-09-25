# Fullscreen Modal

The fullscreen modal is easiest and the safest way to embed Findkit UI on a
website. You don't need to worry about how it fits on your page since it is just
overlayed on top of it. The containing element is automatically created and
appended to the body element.

It is "safe" in the sense that it is accessible. More custom solutions require
may require additional care to ensure accessibility.

```ts
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "<TOKEN>",
});

ui.openFrom("button#open");
```

<Codesandbox example="simple" />
