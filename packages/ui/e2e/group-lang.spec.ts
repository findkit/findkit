import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

test("can set group specific lang", async ({ page }) => {
	await page.goto(staticEntry("/group-lang"));

	const button = page.locator("text=open");
	await button.click();
	const input = page.locator("input:visible");
	await input.type("valu");

	const enHits = page.locator('[data-group-id="en"] .findkit--hit');
	const fiHits = page.locator('[data-group-id="fi"] .findkit--hit');

	// wait for the results to resolve before asserting their length
	await fiHits.first().waitFor({ state: "visible" });

	expect(await fiHits.count()).toBeGreaterThan(0);
	// test website has no english pages
	expect(await enHits.count()).toBe(0);
});
