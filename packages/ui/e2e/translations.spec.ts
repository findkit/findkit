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
		ui.setLang("fi");
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
		ui.setLang("wat");
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
		ui.setLang("wat");
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
		ui.setLang("en");
		Object.assign(window, { ui });
		ui.open();
	});

	const closeButton = page.locator(".findkit--close-button");

	// Variant not in use yet
	await expect(closeButton).toHaveText("Close");

	await page.evaluate(async () => {
		ui.setLang("en-xx");
	});

	await expect(closeButton).toHaveText("custom");
});

test("can customize build-in languages", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "po8GK3G0r" });
		ui.addTranslation("en", { close: "custom" });
		ui.addTranslation("fi", { close: "muokkaus" });
		Object.assign(window, { ui });
		ui.open();
	});

	const closeButton = page.locator(".findkit--close-button");
	await expect(closeButton).toHaveText("custom");

	await page.evaluate(async () => {
		ui.setLang("fi");
	});

	await expect(closeButton).toHaveText("muokkaus");
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
		ui.on("lang", (e) => languageEvents.push(e.lang));

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
		ui.setLang("sv");
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

test("does not cause extra fetches when setting params on 'lang' event", async ({
	page,
}) => {
	await page.goto(staticEntry("/language-event?fdk_q=test"));
	const hits = page.locator(".findkit--hit");
	await expect(hits.first()).toBeVisible();

	const events = await page.evaluate(async () => {
		return (window as any).uiEvents;
	});

	expect(events).toEqual(["lang", "fetch"]);
});
