import { test, expect } from "@playwright/test";

test("can search with custom input with useInput()", async ({ page }) => {
	await page.goto("/use-input");
	const hits = page.locator(".findkit--hit");

	await page.locator("text=open").click();
	await page.locator(".custom-input").type("valu");

	await expect(hits.first()).toBeVisible();
});

test.describe("small window", () => {
	test.use({
		viewport: {
			width: 600,
			height: 600,
		},
	});

	test("hides the custom search input on scroll", async ({ page }) => {
		await page.goto("/use-input");

		const button = page.locator("text=open");
		const input = page.locator(".custom-input");
		const header = page.locator(".findkit--header");

		await button.click();
		await input.type("valu");

		const hits = page.locator(".findkit--hit");
		await hits.first().waitFor({ state: "visible" });

		// Should hide when scrolling down
		await page.mouse.wheel(0, 300);
		await expect(header).toHaveClass(/hidden/);
	});
});
