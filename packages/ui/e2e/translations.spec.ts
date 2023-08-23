import { expect, test } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries/index";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: FindkitUI;

test("change ui language", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "po8GK3G0r" });
		Object.assign(window, { ui });
		ui.open();
	});

	const closeButton = page.locator(".findkit--close-button");
	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		ui.setLanguage("fi");
	});

	await expect(closeButton).toHaveText("Sulje");
});

test("can add custom language", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "po8GK3G0r" });
		Object.assign(window, { ui });
		ui.open();
	});

	const closeButton = page.locator(".findkit--close-button");
	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		ui.addTranslation("wat", {
			close: "wut",
		});
		ui.setLanguage("wat");
	});

	await expect(closeButton).toHaveText("wut");
});

test("can add custom language lazily", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "po8GK3G0r" });
		Object.assign(window, { ui });
		ui.open();
	});

	const closeButton = page.locator(".findkit--close-button");
	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		ui.setLanguage("wat");
	});

	await page.evaluate(async () => {
		ui.addTranslation("wat", {
			close: "wut",
		});
	});

	await expect(closeButton).toHaveText("wut");
});

test("can add custom language variant", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "po8GK3G0r" });
		ui.addTranslation("en-xx", { close: "custom" });
		ui.setLanguage("en");
		Object.assign(window, { ui });
		ui.open();
	});

	const closeButton = page.locator(".findkit--close-button");

	// Variant not in use yet
	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		ui.setLanguage("en-xx");
	});

	await expect(closeButton).toHaveText("custom");
});

test("monitors <html lang>", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "po8GK3G0r" });
		Object.assign(window, { ui });
		ui.open();
	});

	const closeButton = page.locator(".findkit--close-button");
	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		document.documentElement.lang = "fi";
	});

	await expect(closeButton).toHaveText("Sulje");
});

test("emits language events", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "po8GK3G0r" });
		const languageEvents: string[] = [];
		ui.on("language", (e) => languageEvents.push(e.language));

		Object.assign(window, { ui, languageEvents });
		ui.open();
	});

	// emits initial language on start
	await expect
		.poll(async () => {
			return await page.evaluate(async () => {
				return (window as any).languageEvents;
			});
		})
		.toEqual(["en"]);

	await page.evaluate(async () => {
		ui.setLanguage("sv");
	});

	await expect
		.poll(async () => {
			return await page.evaluate(async () => {
				return (window as any).languageEvents;
			});
		})
		.toEqual(["en", "sv"]);

	await page.evaluate(async () => {
		document.documentElement.lang = "fi";
	});

	await expect
		.poll(async () => {
			return await page.evaluate(async () => {
				return (window as any).languageEvents;
			});
		})
		.toEqual(["en", "sv", "fi"]);
});
