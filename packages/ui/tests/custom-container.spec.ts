import { test } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries/index";

declare const ui: FindkitUI;

test("can render the search view to a custom container", async ({ page }) => {
	await page.goto("/custom-container");
	const hits = page.locator(".findkit--hit");

	const input = page.locator('[aria-label="Search input"]');
	await input.type("valu");

	await hits.first().waitFor({ state: "visible" });
});
