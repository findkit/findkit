import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can disable shadow dom", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		document.getElementById("custom-css")!.innerHTML = `
			input {
				background-color: rgb(255, 0, 0) !important;
			}
		`;

		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			shadowDom: false,
			params: {
				tagQuery: [],
			},
		});

		ui.open();
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });

	await expect(input).toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("shadown dom is enabled by default", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		document.getElementById("custom-css")!.innerHTML = `
			input {
				background-color: rgb(255, 0, 0) !important;
			}
		`;

		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		ui.open();
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });

	await expect(input).not.toHaveCSS("background-color", "rgb(255, 0, 0)");
});
