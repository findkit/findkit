import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("openFrom() handles enter on a link ", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const link = document.createElement("a");
		link.href = "#";
		link.textContent = "Open from link";
		document.body.appendChild(link);

		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
		});

		ui.openFrom(link);
	});

	const link = page.locator("text=Open from link");
	await link.focus();
	await page.keyboard.press("Enter");

	const modal = page.locator(".findkit--modal");
	await expect(modal).toBeVisible();
});

test("openFrom() handles enter on button like div ", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const div = document.createElement("div");
		div.textContent = "Open from div";
		div.role = "button";
		div.tabIndex = 0;
		document.body.appendChild(div);

		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
		});

		ui.openFrom(div);
	});

	const link = page.locator("text=Open from div");
	await link.focus();
	await page.keyboard.press("Enter");

	const modal = page.locator(".findkit--modal");
	await expect(modal).toBeVisible();
});

test("openFrom() handles enter from button", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
		});

		ui.openFrom("button");
	});

	const link = page.locator("button");
	await link.focus();
	await page.keyboard.press("Enter");

	const modal = page.locator(".findkit--modal");
	await expect(modal).toBeVisible();
});
