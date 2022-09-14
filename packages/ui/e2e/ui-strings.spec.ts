import { expect, test } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries/index";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: FindkitUI;

test("can set ui language", async ({ page }) => {
	await page.goto("/dummy");

	const closeButton = page.locator(".findkit--close-button");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			ui: { lang: "fi" },
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
	});

	await expect(closeButton).toHaveText("Sulje");
});

test("can change ui language on the fly", async ({ page }) => {
	await page.goto("/dummy");

	const closeButton = page.locator(".findkit--close-button");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
		Object.assign(window, { ui });
	});

	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		await ui.setUIStrings("fi");
	});

	await expect(closeButton).toHaveText("Sulje");
});

test("can customize ui language", async ({ page }) => {
	await page.goto("/dummy");

	const closeButton = page.locator(".findkit--close-button");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			ui: {
				lang: "fi",
				overrides: {
					close: "CUSTOM",
				},
			},
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
	});

	await expect(closeButton).toHaveText("CUSTOM");
});

test("can customize ui language on the fly", async ({ page }) => {
	await page.goto("/dummy");

	const closeButton = page.locator(".findkit--close-button");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
		Object.assign(window, { ui });
	});

	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		await ui.setUIStrings("fi", {
			close: "CUSTOM",
		});
	});

	await expect(closeButton).toHaveText("CUSTOM");
});

test("reads <html lang>", async ({ page }) => {
	await page.goto("/dummy");

	const closeButton = page.locator(".findkit--close-button");

	await page.evaluate(async () => {
		document.documentElement.lang = "fi-FI";
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
		Object.assign(window, { ui });
	});

	await expect(closeButton).toHaveText("Sulje");
});

test("Detects <html lang> mutations", async ({ page }) => {
	await page.goto("/dummy");

	const closeButton = page.locator(".findkit--close-button");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
	});

	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		document.documentElement.lang = "fi";
	});

	await expect(closeButton).toHaveText("Sulje");
});