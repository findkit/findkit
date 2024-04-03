import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can clear text with Cmd/Control+A and Backspace", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "pW1D0p0Dg" });
		ui.openFrom("button");
	});

	await page.locator("button").click();

	const input = page.locator('[aria-label="Search input"]');
	await input.fill("boots");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await input.focus();

	const key = process.platform === "darwin" ? "Meta" : "Control";

	await page.keyboard.down(key);
	await page.keyboard.press("a");
	await page.keyboard.up(key);
	await page.keyboard.press("Backspace");

	await expect(hits.first()).not.toBeVisible();
});

test("can clear input with Cmd/Control+A after opening predefined search from a link", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy?fdk.q=boots"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "pW1D0p0Dg" });
		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const input = page.locator('[aria-label="Search input"]');

	await input.focus();

	const key = process.platform === "darwin" ? "Meta" : "Control";

	await page.keyboard.down(key);
	await page.keyboard.press("a");
	await page.keyboard.up(key);
	await page.keyboard.press("Backspace");

	await expect(hits.first()).not.toBeVisible();
});
