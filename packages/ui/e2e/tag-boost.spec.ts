import { test, expect } from "@playwright/test";
import { assertNotNil } from "@valu/assert";
import type { FindkitUI } from "../src/cdn-entries/index";
import { staticEntry } from "./helpers";

declare const ui: FindkitUI;
declare const MOD: typeof import("../src/cdn-entries/index");

test("can use tag boost", async ({ page }) => {
	// TODO remove __findkit_version=n
	await page.goto(staticEntry("/dummy") + "#__findkit_version=n");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "po8GK3G0r" });

		Object.assign(window, { ui });

		ui.open("valu");
	});

	const hits = page.locator(".findkit--hit");

	await hits.first().waitFor({ state: "visible" });
	const score1 = await hits.first().getAttribute("data-fdk-score");
	assertNotNil(score1);

	await page.evaluate(async () => {
		ui.updateParams((params) => {
			params.tagBoost = {
				"domain/valu.fi": 10,
			};
		});
	});

	await expect
		.poll(async () => {
			return await hits.first().getAttribute("data-fdk-score");
		})
		.not.toEqual(score1);

	const score2 = await hits.first().getAttribute("data-fdk-score");
	assertNotNil(score2);

	const scoreDiff = Number(score2) - Number(score1);
	expect(scoreDiff).toBeGreaterThan(100);
});
