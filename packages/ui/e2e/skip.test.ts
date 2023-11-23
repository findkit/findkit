import { test, expect } from "@playwright/test";
import { staticEntry } from "../e2e/helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can skip group search", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 0,
			groups: [
				{
					previewSize: 2,
				},
				{
					previewSize: 2,
					params: { skip: false as boolean },
				},
			],
		});

		ui.on("fetch", (e) => {
			e.transientUpdateGroups((_first, second) => {
				second.params.skip = true;
			});
		});

		ui.open();
	});

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });

	const group = page.locator(".findkit--group");

	await expect(group.nth(0).locator(".findkit--hit")).toHaveCount(2);
	await expect(group.nth(1).locator(".findkit--hit")).toHaveCount(0);
});
