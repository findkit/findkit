import { Page, expect, test } from "@playwright/test";
import {
	fixFirefoxTab,
	mockSearchResponses,
	pressTab,
	staticEntry,
} from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

fixFirefoxTab();

async function gotoTestPage(
	page: Page,
	options?: {
		inert?: string;
		noShadow?: "true";
	},
) {
	const qs = new URLSearchParams(options);
	await page.goto(staticEntry("/basic-focus-management?" + qs.toString()));
	await mockSearchResponses(page);
}

async function testFocusManagement(page: Page) {
	const input = page.locator(".findkit--search-input");
	const openButton = page.locator('button:text("open")');
	const hit = page.locator(".findkit--hit a").first();

	await test.step("initial input focus", async () => {
		await openButton.focus();
		await page.keyboard.press("Enter");
		await input.waitFor({ state: "visible" });
		await expect(input).toBeFocused();
	});

	await test.step("can focus first hit", async () => {
		await input.fill("test");
		await hit.waitFor({ state: "visible" });
		await pressTab(page);
		await expect(hit).toBeFocused();
		await pressTab(page, { shift: true });
		await expect(input).toBeFocused();
	});

	await test.step("can focus close button", async () => {
		await pressTab(page, { shift: true });
		await expect(page.locator(".findkit--close-button")).toBeFocused();
		await page.keyboard.press("Enter");
		await expect(openButton).toBeFocused();
	});

	await test.step("esc restores focus to the open button", async () => {
		await page.keyboard.press("Enter");
		await expect(input).toBeFocused();
		await page.keyboard.press("Escape");
		await expect(openButton).toBeFocused();
	});

	await test.step("input is focused on reload", async () => {
		await page.keyboard.press("Enter");
		await page.reload();
		await page.waitForLoadState("domcontentloaded");
		await expect(input).toBeFocused();
	});

	await test.step("cannot focus background elements", async () => {
		await pressTab(page, { shift: true }); // close button
		await pressTab(page, { shift: true });
		await expect(openButton).not.toBeFocused();
	});
}

test.describe("basic focus management", () => {
	test("with defaults", async ({ page }) => {
		await gotoTestPage(page);
		await testFocusManagement(page);
	});

	test("without shadow dom", async ({ page }) => {
		await gotoTestPage(page, { noShadow: "true" });
		await testFocusManagement(page);
	});

	test("with manual inert", async ({ page }) => {
		await gotoTestPage(page, { inert: "#open-button" });
		await testFocusManagement(page);
	});
	test("without shadown dom with manual inert", async ({ page }) => {
		await gotoTestPage(page, {
			noShadow: "true",
			inert: "#open-button",
		});
		await testFocusManagement(page);
	});
});

test("do not make the findkit host element inert", async ({ page }) => {
	// when using a common pattern of setting non-header elements to inert
	// So users don't have to add :not(.findkit--host)
	await page.goto(staticEntry("/dummy"));
	await mockSearchResponses(page);

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		document.body.innerHTML = `
			<header></header>
			<main></main>
			<footer></footer>
		`;

		const ui = new FindkitUI({
			publicToken: "test",
			inert: "body > *:not(header)",
		});

		ui.open();
	});

	const input = page.locator("input").first();
	await input.waitFor({ state: "visible" });

	await expect(page.locator("header")).not.toHaveAttribute("inert");
	await expect(page.locator("main")).toHaveAttribute("inert");
	await expect(page.locator("footer")).toHaveAttribute("inert");
	await expect(page.locator(".findkit--host")).not.toHaveAttribute("inert");
});
