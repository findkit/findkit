import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can disable buildin style loading with builtinStyles: false", async ({
	page,
}) => {
	let styleLoaded = false;

	await page.route(
		(url) => url.pathname.endsWith("build/styles.css"),
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (route) => {
			styleLoaded = true;
			await route.continue();
		},
	);

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			builtinStyles: false,
		});

		ui.open();
	});

	await page.waitForSelector(".findkit--header", { state: "visible" });

	const inputElement = page.locator(".findkit--search-input");
	await expect(inputElement).toHaveCSS("border-radius", "0px");

	expect(styleLoaded).toBe(false);
});
