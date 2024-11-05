import { test, expect } from "@playwright/test";
import { assertNotNil } from "@valu/assert";
import { staticEntry } from "./helpers";

test("can load more results when using only one group", async ({ page }) => {
	await page.goto(staticEntry("/multiple-instances-with-searchkey"));
	const hits = page.locator(".findkit--hit a");
	const input = page.locator("input:visible");

	const button = page.locator("button", { hasText: "open 1" });
	await button.click();
	await input.type("test");
	await expect(hits.first()).toBeVisible();

	const href1 = await hits.first().getAttribute("href");
	assertNotNil(href1);

	await page.keyboard.press("Escape");

	const button2 = page.locator("button", { hasText: "open 2" });
	await button2.click();
	await input.type("test");
	await expect(hits.first()).toBeVisible();

	const href2 = await hits.first().getAttribute("href");
	assertNotNil(href2);

	expect(new URL(href1).hostname).not.toBe(new URL(href2).hostname);
});
