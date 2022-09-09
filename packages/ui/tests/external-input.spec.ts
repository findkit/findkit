import { test, expect } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries/index";

test("can use external input with modal", async ({ page }) => {
	await page.goto("/external-input");

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit a");
	const randomButton = page.locator("text=Random button");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();
	await expect(input).toBeFocused();

	await page.keyboard.press("Tab");
	// Jumps over the random button to the first hit
	await expect(hits.first()).toBeFocused();

	// Escape closes the modal and returns focus to the input
	await page.keyboard.press("Escape");
	await expect(input).toBeFocused();

	await page.keyboard.press("Tab");
	// Random butotn is can be focused when the modal is closed
	await expect(randomButton).toBeFocused();
});
