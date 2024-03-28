import { expect, test } from "@playwright/test";
import { mockSearchResponses, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("search results are in article element with lang-attributes", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));
	await mockSearchResponses(page);

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const ui = new FindkitUI({
			publicToken: "test",
		});

		ui.open("boots");
	});

	const fiTitle = page
		.locator(".findkit--hit-title a", { hasText: "Kumikengät" })
		.first();
	await expect(fiTitle).toHaveAttribute("lang", "fi");

	const enTitle = page
		.locator(".findkit--hit-title a", { hasText: "Rubber Boots" })
		.first();
	await expect(enTitle).toHaveAttribute("lang", "en");

	const fiHighlights = page
		.locator(".findkit--hit", { hasText: "Kumikengät" })
		.locator(".findkit--highlight div")
		.first();

	await expect(fiHighlights).toHaveAttribute("lang", "fi");

	const enHighlights = page
		.locator(".findkit--hit", { hasText: "Rubber Boots" })
		.locator(".findkit--highlight div")
		.first();

	await expect(enHighlights).toHaveAttribute("lang", "en");
});
