// Make sure CSS :target is updated on SPA navigation.

// Using Modern Navigation API that might not exists on all browsers.
if (typeof navigation !== "undefined") {
	let fixingCSSTarget = false;

	navigation.addEventListener("navigate", (event) => {
		const current = new URL(location.href.toString());
		const dest = new URL(event.destination.url);

		if (current.pathname === dest.pathname) {
			return;
		}

		const hash = dest.hash;
		if (!hash || hash === "#") {
			return;
		}

		if (fixingCSSTarget) {
			return;
		}

		fixingCSSTarget = true;

		setTimeout(() => {
			// https://github.com/whatwg/html/issues/639#issuecomment-252716663
			history.pushState(null, "", "#");
			history.back();
			fixingCSSTarget = false;
		}, 400);
	});
}
