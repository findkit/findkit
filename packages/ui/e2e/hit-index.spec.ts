import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("hit slots gets hit index", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 0,
			fetchCount: 3,
			slots: {
				Hit(props) {
					return html`<div class="index">Index ${props.hit.index + 1}</div>
						<div class="title">${props.hit.title}</div>`;
				},
			},
		});

		ui.open();
	});

	const indexHits = page.locator(".index", { hasText: "Index 10" });
	await indexHits.waitFor({ state: "visible" });

	for (let i = 0; i <= 10; i++) {
		const hitLocator = page.locator(`.index`).nth(i);
		const text = await hitLocator.textContent();
		expect(text).toEqual(`Index ${i + 1}`);
	}

	await page.locator("input").fill("boots");
	await page
		.locator(`.findkit--hit`, { hasText: "boots" })
		.nth(1)
		.waitFor({ state: "visible" });

	const hitLocator = page.locator(".index").nth(0);
	const text = await hitLocator.textContent();
	expect(text).toEqual("Index 1");
});
