import { test, expect } from "@playwright/test";

test("can load more results when using only one group", async ({ page }) => {
	await page.goto("/single-group");
	const hits = page.locator(".findkit--hit");
	const loading = page.locator(".findkit--logo-animating");

	const button = page.locator("text=open");

	await button.click();

	const input = page.locator("input:visible");

	await input.type("mikko");

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

test("the input is cleared when the modal is closed", async ({ page }) => {
	await page.goto("/single-group");
	const hits = page.locator(".findkit--hit");

	await page.locator("text=open").click();
	await page.locator("input:visible").type("mikko");

	await hits.first().waitFor({ state: "visible" });

	await page.keyboard.press("Escape");

	await page.locator("text=open").click();

	expect(await page.locator('[aria-label="Search input"]').inputValue()).toBe(
		""
	);
});

test("search input is focused on open and restored back to opening element when closing", async ({
	page,
}) => {
	await page.goto("/single-group");

	const button = page.locator("text=open");

	await button.click();

	await expect(page.locator('[aria-label="Search input"]')).toBeFocused();

	await page.keyboard.press("Escape");

	await expect(button).toBeFocused();
});

test.describe("small window", () => {
	test.use({
		viewport: {
			width: 600,
			height: 600,
		},
	});

	test("hides the search input on scroll", async ({ page }) => {
		await page.goto("/single-group", {});

		const button = page.locator("text=open");
		const input = page.locator('[aria-label="Search input"]');
		const header = page.locator(".findkit--header");

		await button.click();
		await input.type("mikko");

		const hits = page.locator(".findkit--hit");
		await hits.first().waitFor({ state: "visible" });

		// Should hide when scrolling down
		await page.mouse.wheel(0, 300);
		await expect(header).toHaveClass(/hidden/);

		// Restores on scroll up
		await page.mouse.wheel(0, -200);
		await expect(header).not.toHaveClass(/hidden/);

		// Hide and close
		await page.mouse.wheel(0, 300);
		await page.keyboard.press("Escape");

		// Should be visible again when opening again
		await page.locator("text=open").click();
		await expect(header).not.toHaveClass(/hidden/);
	});
});
