import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("updated params are synchronously available when loaded", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	const params = await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "pW1D0p0Dg" });
		await ui.preload();
		ui.updateParams({ tagBoost: { ding: 1 } });
		return ui.params;
	});

	expect(params.tagBoost).toEqual({ ding: 1 });
});

test("all group params are optional", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	const ids = await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 0,
			groups: [{}, {}],
		});
		ui.open();

		await ui.preload();

		return ui.groups.map((g) => g.id);
	});

	expect(ids).toEqual(["group-1", "group-2"]);

	const groups = page.locator(".findkit--group");
	await expect(groups).toHaveCount(2);

	const hits = page.locator(".findkit--hit");
	// 5 is the default preview size per group
	await expect(hits).toHaveCount(10);
});

test("can customize params.size", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			infiniteScroll: false,
			params: {
				size: 3,
			},
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	const loadMore = page.locator("text=Load more");

	await expect(hits).toHaveCount(3);
	await loadMore.click();
	await expect(hits).toHaveCount(6);
});
