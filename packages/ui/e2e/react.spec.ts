import { test, expect } from "@playwright/test";
import { viteEntry } from "./helpers";

test("can open the fullscreen modal from react button", async ({ page }) => {
	await page.goto(viteEntry("fullscreen"));
	const hits = page.locator(".findkit--hit");
	const button = page.locator("text=Open Search");

	await button.click();

	const input = page.locator("input:visible");

	await input.fill("valu");

	await hits.first().waitFor({ state: "visible" });

	await page.goBack();

	await expect(hits.first()).not.toBeVisible();
});
