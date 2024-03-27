import { test, expect } from "@playwright/test";
import { getScrollPosition, staticEntry } from "./helpers";

test.use({
	viewport: {
		width: 600,
		height: 600,
	},
});

test("can select first element", async ({ page }) => {
	await page.goto(staticEntry("/two-groups"));
	const hits = page.locator(".findkit--hit");
	await page.locator("text=open").click();
	await page.locator('[aria-label="Search input"]').fill("mikko");
	await hits.first().waitFor({ state: "visible" });
	const firstHit = await hits
		.first()
		.evaluate((hit) => hit.querySelector("a")?.href);

	await page.keyboard.down("ArrowDown");

	const selected = await page
		.locator("[data-kb-current] a")
		.first()
		.evaluate((link) => {
			if (link instanceof HTMLAnchorElement) {
				return link.href;
			}
		});

	expect(firstHit).toBe(selected);

	await page.keyboard.down("Enter");

	await expect(page).toHaveURL(selected + "/");
});

test("can navigate to group", async ({ page }) => {
	await page.goto(staticEntry("/two-groups"));
	const hits = page.locator(".findkit--hit");
	const groupTitles = page.locator(".findkit--group-title");
	await page.locator("text=open").click();
	await page.locator('[aria-label="Search input"]').fill("mikko");

	await hits.first().waitFor({ state: "visible" });

	// Go to the group more link
	for (let i = 0; i < 6; i++) {
		await page.keyboard.down("ArrowDown");
	}

	await expect.poll(async () => getScrollPosition(page)).toBeGreaterThan(50);

	// Wait for the smooth scroll animation finish
	await page.waitForTimeout(500);

	// Select the group
	await page.keyboard.down("Enter");

	expect(await groupTitles.count()).toBe(1);

	await expect.poll(async () => getScrollPosition(page)).toBe(0);

	// Go back link
	await page.keyboard.down("ArrowDown");

	// First hit
	await page.keyboard.down("ArrowDown");

	const firstHit = await hits
		.first()
		.evaluate((hit) => hit.querySelector("a")?.href);

	const selected = await page
		.locator("[data-kb-current] a")
		.first()
		.evaluate((link) => {
			if (link instanceof HTMLAnchorElement) {
				return link.href;
			}
		});

	expect(firstHit).toBe(selected);

	await page.keyboard.down("Enter");

	await page.waitForLoadState("domcontentloaded");

	await expect(page).toHaveURL(selected + "/");

	await page.goBack();

	// The hit is focused, so move the focus manually to the input
	// to activate the keyboard navigation
	await page.locator("input").focus();

	await hits.first().waitFor({ state: "visible" });

	// Go back link
	await page.keyboard.down("ArrowDown");

	await expect(page.locator("[data-kb-current]")).toHaveText("Back");
	await page.keyboard.down("Enter");
	expect(await groupTitles.count()).toBe(2);
});

test("can keyboard navigate in custom container", async ({ page }) => {
	await page.goto(staticEntry("/custom-container"));
	const hits = page.locator(".findkit--hit");

	const input = page.locator('[aria-label="Search input"]');
	await input.type("valu");

	await hits.first().waitFor({ state: "visible" });

	for (let i = 0; i < 6; i++) {
		await page.keyboard.down("ArrowDown");
	}

	await expect
		.poll(async () => page.evaluate(() => document.documentElement.scrollTop))
		.toBeGreaterThan(100);
});
