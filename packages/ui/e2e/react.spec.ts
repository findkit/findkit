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

test("can embed inside React", async ({ page }) => {
	await page.goto(viteEntry("embed"));
	const hits = page.locator(".findkit--hit a");

	const uiTagButton = page.locator("button", { hasText: "ui" });
	const crawlerTagButton = page.locator("button", { hasText: "crawler" });

	await expect(uiTagButton).not.toBeDisabled();
	await expect(crawlerTagButton).toBeDisabled();

	await expect(hits.first()).toBeVisible();

	const initialHit = await hits
		.first()
		.evaluate((node: HTMLAnchorElement) => node.href);

	await uiTagButton.click();

	await expect(uiTagButton).toBeDisabled();
	await expect(crawlerTagButton).not.toBeDisabled();

	await expect(hits.first()).not.toHaveAttribute("href", initialHit);
});
