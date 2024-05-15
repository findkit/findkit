import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test('"or" search terms', async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg:eu-north-1",
			params: { operator: "or" },
		});

		(window as any).ui = ui;

		ui.open("boots notexistsinindex");
	});

	const hits = page.locator(".findkit--hit");

	await page.evaluate(async () => {
		ui.updateParams({ operator: "and" });
	});

	await expect(hits.first()).not.toBeVisible();
});
