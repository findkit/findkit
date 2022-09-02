import { test, expect } from "@playwright/test";

declare const MOD: typeof import("../src/cdn-entries/index");

test("input is visually correct", async ({ page }) => {
	await page.goto("/single-group");

	const input = page.locator('[aria-label="Search input"]');
	const button = page.locator("text=open");
	const hits = page.locator(".findkit--hit");

	await button.click();
	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	await expect(page.locator(".findkit--header")).toHaveScreenshot();
});

test("can show backdrop", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			css: MOD.css`
				.findkit--modal {
					inset: 20px;
				}
			`,
		});

		await ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("centers the content with width css", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			css: MOD.css`
				.findkit--modal {
                    inset: initial;
                    width: 400px;
                    margin: 10px;
				}
			`,
		});

		await ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});
