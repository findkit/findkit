import { test, expect } from "@playwright/test";

test("refresh restores search results", async ({ page }) => {
	await page.goto("/hash-router");
	const hits = page.locator(".findkit--hit");

	await page.locator("text=open").click();
	await page.locator("input:visible").type("mikko");
	await hits.first().waitFor({ state: "visible" });

	await page.reload();

	await expect(hits.first()).toBeVisible();

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);
});
