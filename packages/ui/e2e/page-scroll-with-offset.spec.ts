import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

test("can scroll page when using absolute positioning", async ({ page }) => {
	await page.goto(staticEntry("/resize-observer"));
	await page.setViewportSize({ width: 600, height: 600 });
	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit");

	await input.fill("valu");

	await hits.first().waitFor({ state: "visible" });

	await page.mouse.wheel(0, 300);

	await expect
		.poll(async () => page.evaluate(() => document.documentElement.scrollTop))
		.toBeGreaterThan(100);
});
