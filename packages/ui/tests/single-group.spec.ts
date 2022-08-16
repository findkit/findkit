import { test, expect } from "@playwright/test";

test("can load more results when using only one group", async ({ page }) => {
	await page.goto("http://localhost:28104/single-group");
	const hits = page.locator(".findkit--hit");
	const groupTitles = page.locator(".findkit--group-title");
	const loading = page.locator(".findkit--loading");

	const button = page.locator("text=open");

	await button.click();

	const input = page.locator("input:visible");

	await input.type("mikko");

	expect(await groupTitles.count()).toBe(1);
	await hits.first().waitFor({ state: "visible" });

	await page.locator(".findkit--more-link").first().waitFor({
		state: "detached",
	});

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);

	await page.locator(".findkit--load-more-button").first().click();

	await loading.waitFor({ state: "hidden" });

	const hitCount2 = await hits.count();
	expect(hitCount2).toBeGreaterThan(hitCount1);

	await page
		.locator(".findkit--back-link")
		.first()
		.waitFor({ state: "detached" });
});

// test("focus management", async ({ page }) => {
// 	await page.goto("http://localhost:28104/single-group");

// 	const button = page.locator("text=open");

// 	await button.click();

// 	const input = page.locator("input:visible");
// 	await input.waitFor({ state: "visible" });
// 	expect(input).toBeFocused();
// });
