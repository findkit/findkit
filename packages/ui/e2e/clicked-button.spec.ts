import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("opens from modal immedaitely with .openFrom() from a button with data-clicked", async ({
	page,
}) => {
	await page.goto(staticEntry("/clicked-button"));

	const button = page.locator("#open-button");
	// Click the button before initializing the Finkdit UI instance
	await button.click();

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "noop" });
		ui.openFrom("#open-button");
	});

	const header = page.locator(".findkit--header");
	await expect(header).toBeVisible();
});
