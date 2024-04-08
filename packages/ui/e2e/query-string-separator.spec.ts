import { expect, test } from "@playwright/test";
import { mockSearchResponses, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can customize query string name space separator", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));
	await mockSearchResponses(page);

	const init = async () => {
		await page.evaluate(async () => {
			const { FindkitUI } = MOD;

			const ui = new FindkitUI({
				publicToken: "test",
				separator: ".",
				groups: [
					{
						title: "GroupA",
						id: "group-a",
					},
					{
						title: "GroupB",
						id: "group-b",
					},
				],
			});

			ui.openFrom("#open-button");
		});
	};
	await init();

	await page.locator("#open-button").click();
	await page.locator("input").fill("test");
	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });

	{
		const url = new URL(page.url());
		expect(url.search).toEqual("?fdk.q=test");
	}

	await page.locator('text="Show more search results"').first().click();

	await page
		.locator(".findkit--back-link")
		.first()
		.waitFor({ state: "visible" });

	{
		const url = new URL(page.url());
		expect(url.search).toEqual("?fdk.q=test&fdk.id=group-a");
	}

	await page.reload({ waitUntil: "domcontentloaded" });

	await init();

	await expect(hit).toBeVisible();
});
