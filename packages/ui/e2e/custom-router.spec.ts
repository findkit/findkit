import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("search works with a custom router backend without touching the url", async ({
	page,
}) => {
	await page.goto(staticEntry("/custom-router"));
	const hits = page.locator(".findkit--hit");

	await page.locator("text=open").click();
	await page.locator("input:visible").type("mikko");
	await hits.first().waitFor({ state: "visible" });

	// The custom backend saves the state to sessionStorage so the url must
	// stay untouched
	expect(new URL(page.url()).search).toBe("");
	expect(new URL(page.url()).hash).toBe("");
});

test("refresh restores search results from the custom router backend", async ({
	page,
}) => {
	await page.goto(staticEntry("/custom-router"));
	const hits = page.locator(".findkit--hit");

	await page.locator("text=open").click();
	await page.locator("input:visible").type("mikko");
	await hits.first().waitFor({ state: "visible" });

	await page.reload();

	await expect(hits.first()).toBeVisible();

	const hitCount = await hits.count();
	expect(hitCount).toBeGreaterThan(2);
});

test("can navigate to full group results and back with a custom router backend", async ({
	page,
}) => {
	await page.goto(staticEntry("/custom-router"));
	const hits = page.locator(".findkit--hit");
	const groupTitles = page.locator(".findkit--group-title");

	await page.locator("text=open").click();

	await groupTitles.first().waitFor({ state: "visible" });
	expect(await groupTitles.count()).toBe(2);

	await page.locator("input:visible").fill("wordpress");

	expect(await groupTitles.count()).toBe(2);
	await hits.first().waitFor({ state: "visible" });

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);

	await page.locator(".findkit--single-group-link").first().click();

	await expect.poll(() => hits.count()).toBeGreaterThan(hitCount1);

	expect(await groupTitles.count()).toBe(1);

	await page.locator(".findkit--back-link").first().click();

	await expect.poll(() => hits.count()).toBeLessThan(hitCount1 + 1);
});

test("invalid custom router backend throws a helpful error", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	const message = await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			// Missing all the other methods
			router: { getSearchParamsString: () => "" } as any,
		});

		return await ui.preload().then(
			() => "no error",
			(error) => String(error),
		);
	});

	expect(message).toContain("Invalid custom router backend");
	expect(message).toContain("listen");
	expect(message).toContain("update");
});
