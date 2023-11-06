import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("calls the global FINDKIT_GET_JWT_TOKEN when defined", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		Object.assign(window, {
			__count: 0,
			async FINDKIT_GET_JWT_TOKEN() {
				this.__count++;
			},
		});

		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			params: {
				tagQuery: [],
			},
		});

		ui.open("test");
	});

	await expect
		.poll(async () => {
			return await page.evaluate(async () => {
				return (window as any).__count as number;
			});
		})
		.toBeGreaterThan(0);
});
