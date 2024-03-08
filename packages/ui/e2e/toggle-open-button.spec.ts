import { test, expect } from "@playwright/test";
import { staticEntry } from "../e2e/helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("closes the modal when a 'openFrom' button is clicked again", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, css } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			trap: false,
			css: css`
				.findkit--container {
					top: 2rem;
				}
			`,
		});

		ui.openFrom("#open-button");
	});

	const button = page.locator("#open-button");
	await button.click();

	const header = page.locator(".findkit--header");
	await header.waitFor({ state: "visible" });

	await button.click();
	await expect(header).not.toBeVisible();
});
