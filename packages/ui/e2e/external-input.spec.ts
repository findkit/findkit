import { test, expect } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries/index";

declare const ui: FindkitUI;

test("can use external input with modal", async ({ page }) => {
	await page.goto("/external-input");

	await page.evaluate(async () => {
		ui.bindInput("#external-input");
	});

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
	await expect(hits.first()).not.toBeVisible();

	await page.keyboard.press("Tab");
	// Random button is can be focused when the modal is closed
	await expect(randomButton).toBeFocused();

	// Enter press in the input opens the modal
	await input.focus();
	await page.keyboard.press("Enter");
	await expect(hits.first()).toBeVisible();
});

test("can lazily bind input", async ({ page }) => {
	await page.goto("/external-input");

	await page.evaluate(async () => {
		ui.open();
		await new Promise((resolve) => setTimeout(resolve, 1000));
		void ui.bindInput("#external-input"!);
	});

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit a");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();
	await expect(input).toBeFocused();

	await page.keyboard.press("Tab");
	// Jumps over the random button to the first hit
	await expect(hits.first()).toBeFocused();
});
