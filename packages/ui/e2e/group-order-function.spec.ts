import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

test("can set group order with function", async ({ page }) => {
	await page.goto(staticEntry("/group-order-function"));
	const groupTitles = page.locator(".findkit--group-title");
	const hits = page.locator(".findkit--hit");

	const button = page.locator("text=open");
	await button.click();
	const input = page.locator("input:visible");
	await input.type("valu");
	await hits.first().waitFor({ state: "visible" });

	await groupTitles.first().waitFor({ state: "visible" });
	const title = groupTitles.first();

	expect(await groupTitles.count()).toBe(3);
	expect(await title.innerText()).toContain("Group set to first with code");
});
