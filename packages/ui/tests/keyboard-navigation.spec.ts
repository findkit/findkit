import { test, expect } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries";

declare const ui: FindkitUI;

test("can select first element", async ({ page }) => {
	await page.goto("/two-groups");
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
	await page.goto("/two-groups");
	const hits = page.locator(".findkit--hit");
	const groupTitles = page.locator(".findkit--group-title");
	await page.locator("text=open").click();
	await page.locator('[aria-label="Search input"]').fill("mikko");

	await hits.first().waitFor({ state: "visible" });

	// Go to the group more link
	for (let i = 0; i < 6; i++) {
		await page.keyboard.down("ArrowDown");
	}

	// Select the group
	await page.keyboard.down("Enter");

	expect(await groupTitles.count()).toBe(1);

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

	// Go back link
	await page.keyboard.down("ArrowDown");

	await expect(page.locator("[data-kb-current]")).toHaveText("Back");
	await page.keyboard.down("Enter");
	expect(await groupTitles.count()).toBe(2);
});
