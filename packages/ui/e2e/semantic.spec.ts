import { expect, test } from "@playwright/test";
import { mockSearchResponses, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("semantic search", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));
	await mockSearchResponses(page);

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const ui = new FindkitUI({
			publicToken: "test",
			groups: [
				{
					params: {
						semantic: {
							mode: "only",
						},
					},
				},
			],
		});

		ui.open("boots");
	});

	expect(1).toBe(1);
});
