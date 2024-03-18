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

	const fi = page.locator("article", { hasText: "Kumikengät" }).first();
	await expect(fi).toHaveAttribute("lang", "fi");

	const en = page.locator("article", { hasText: "Rubber Boots" }).first();
	await expect(en).toHaveAttribute("lang", "en");
});

test("group are in sections", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));
	await mockSearchResponses(page);

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const ui = new FindkitUI({
			publicToken: "test",
			groups: [{ title: "Ding" }, { title: "Dong" }],
		});

		ui.open("boots");
	});

	const group1 = page.locator("section", { hasText: "Ding" }).first();
	await expect(group1).toHaveClass("findkit--group");

	const group2 = page.locator("section", { hasText: "Dong" }).first();
	await expect(group2).toHaveClass("findkit--group");
});
