import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test.skip("plaa", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pJMDjpYOE",
			searchEndpoint:
				"https://staging---search.findkit.com/c/pJMDjpYOE/search?p=pJMDjpYOE",
			minTerms: 0,
			params: {
				tagQuery: [],
			},
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });
});
