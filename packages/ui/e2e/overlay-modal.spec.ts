import { test, expect, Page } from "@playwright/test";

async function testNavigationAndFocus(page: Page) {
	const input = page.locator("#external-input");
	const hits = page.locator(".findkit-overlay-container .findkit--hit a");
	const randomLink = page.locator("text=Random");
	const closeButton = page.locator("#close");

	await input.fill("valu");

	await expect(hits.first()).toBeVisible();

	await page.keyboard.press("Tab");
	// Focus goes to manually trapped close button
	await expect(closeButton).toBeFocused();

	// Jumps over other header links directly to the first hit
	await page.keyboard.press("Tab");
	await expect(hits.first()).toBeFocused();

	// Can go back to the close button with shift+tab
	await page.keyboard.down("Shift");
	await page.keyboard.press("Tab");
	await page.keyboard.up("Shift");
	await expect(closeButton).toBeFocused();

	// Can close the modal with the close button
	await page.keyboard.press("Enter");
	await expect(hits.first()).not.toBeVisible();

	// Focus retuns to the initial element
	await expect(input).toBeFocused();

	// Can focus other header links when the modal is closed
	await page.keyboard.press("Tab");
	await page.keyboard.press("Tab");
	await expect(randomLink).toBeFocused();
}

test("can use overlay modal with proper focus management", async ({ page }) => {
	await page.goto("/overlay-modal");
	await testNavigationAndFocus(page);
});

test("can use overlay modal with proper focus management without shadow dom", async ({
	page,
}) => {
	await page.goto("/overlay-modal?no-shadow");
	await testNavigationAndFocus(page);
});

test("keyboard navigation scrolls", async ({ page }) => {
	await page.goto("/overlay-modal");

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();

	// Go to the group more link
	for (let i = 0; i < 6; i++) {
		await page.keyboard.down("ArrowDown");
	}

	await expect
		.poll(async () => {
			return page.evaluate(() => document.documentElement.scrollTop);
		})
		.toBeGreaterThan(50);
});
