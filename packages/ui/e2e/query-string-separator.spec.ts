import { expect, test } from "@playwright/test";
import { mockSearchResponses, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can customize query string name space separator", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));
	await mockSearchResponses(page);

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const ui = new FindkitUI({
			publicToken: "test",
			separator: "___",
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

		ui.open();
	});

	await page.locator("input").fill("test");
	await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

	{
		const url = new URL(page.url());
		expect(url.search).toEqual("?fdk___q=test");
	}

	await page.locator('text="Show more search results"').first().click();

	await page
		.locator(".findkit--back-link")
		.first()
		.waitFor({ state: "visible" });

	{
		const url = new URL(page.url());
		expect(url.search).toEqual("?fdk___q=test&fdk___id=group-a");
	}
});
