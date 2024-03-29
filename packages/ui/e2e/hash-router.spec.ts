import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

test("refresh restores search results", async ({ page }) => {
	await page.goto(staticEntry("/hash-router"));
	const hits = page.locator(".findkit--hit");

	await page.locator("text=open").click();
	await page.locator("input:visible").type("mikko");
	await hits.first().waitFor({ state: "visible" });

	await page.reload();

	await expect(hits.first()).toBeVisible();

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);
});

test("can navigate to full group results and back", async ({ page }) => {
	await page.goto(staticEntry("/hash-router"));
	const hits = page.locator(".findkit--hit");
	const groupTitles = page.locator(".findkit--group-title");

	await page.locator("text=open").click();

	await groupTitles.first().waitFor({ state: "visible" });
	expect(await groupTitles.count()).toBe(2);

	await page.locator("input:visible").fill("wordpress");

	expect(await groupTitles.count()).toBe(2);
	await hits.first().waitFor({ state: "visible" });

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);

	await page.locator(".findkit--single-group-link").first().click();

	await expect.poll(() => hits.count()).toBeGreaterThan(hitCount1);
	const hitCount2 = await hits.count();

	expect(await groupTitles.count()).toBe(1);

	await page.locator(".findkit--load-more-button").first().click();

	await expect.poll(() => hits.count()).toBeGreaterThan(hitCount2);
	const hitCount3 = await hits.count();

	await page.locator(".findkit--back-link").first().click();

	await expect.poll(() => hits.count()).toBeLessThan(hitCount3);
});
