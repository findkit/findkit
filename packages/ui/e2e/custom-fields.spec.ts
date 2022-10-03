import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

test("can use external input with modal", async ({ page }) => {
	await page.goto(staticEntry("/custom-fields"));

	const button = page.locator("text=open");
	const input = page.locator('[aria-label="Search input"]');
	const hits = page.locator(".findkit--hit");
	const img = page.locator(".findkit--hit img");

	await button.click();
	await input.type("mikko");

	await hits.first().waitFor({ state: "visible" });

	await expect(img.first()).toBeVisible();

	const attr = await img.first().getAttribute("src");
	expect(attr).toMatch(/\.jpg$/);
});
