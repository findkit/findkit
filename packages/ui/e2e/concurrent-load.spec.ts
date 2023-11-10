import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can load multiple instances", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		document.querySelector("button")?.remove();
		const { FindkitUI } = MOD;
		const button = document.createElement("button");
		button.className = "open-modal";
		button.innerText = "Open modal";
		document.body.appendChild(button);

		const ui = new FindkitUI({
			instanceId: "modal",
			publicToken: "pW1D0p0Dg",
		});

		Object.assign(window, { ui });

		ui.openFrom("button.open-modal");
	});

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const container = document.createElement("div");
		container.id = "findkit-container";
		document.body.appendChild(container);

		const ui = new FindkitUI({
			instanceId: "container",
			publicToken: "pW1D0p0Dg",
			container: container,
		});

		ui.open("boots");
	});

	await page
		.locator("#findkit-container .findkit--hit")
		.first()
		.waitFor({ state: "visible" });

	await page.click("button.open-modal");

	await expect(page.locator(".findkit--modal")).toBeVisible();
});
