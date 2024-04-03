import { test, expect } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries";
import { staticEntry } from "./helpers";

declare const ui: FindkitUI;

test("can navigate to full group results and back", async ({ page }) => {
	await page.goto(staticEntry("/two-groups"));
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
	const hitCount2 = await hits.count();

	expect(await groupTitles.count()).toBe(1);

	await page.locator(".findkit--load-more-button").first().click();

	await expect.poll(() => hits.count()).toBeGreaterThan(hitCount2);
	const hitCount3 = await hits.count();

	await page.locator(".findkit--back-link").first().click();

	await expect.poll(() => hits.count()).toBeLessThan(hitCount3);
});

test("refresh restores search results", async ({ page }) => {
	await page.goto(staticEntry("/two-groups"));

	const hits = page.locator(".findkit--hit");

	await page.locator("text=open").click();
	await page.locator("input:visible").fill("mikko");
	await hits.first().waitFor({ state: "visible" });

	await page.reload();

	await expect(hits.first()).toBeVisible();

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);
});

test("can navigate directly to a group results", async ({ page }) => {
	await page.goto(staticEntry("/two-groups?fdk_q=mikko&fdk_id=valu"));
	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);
});

test("can navigate directly to the second group results", async ({ page }) => {
	await page.goto(staticEntry("/two-groups?fdk_q=valu&fdk_id=statement"));
	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);
});

test("back button works", async ({ page }) => {
	await page.goto(staticEntry("/two-groups"));
	const hits = page.locator(".findkit--hit");
	const groupTitles = page.locator(".findkit--group-title");

	await page.locator("text=open").click();
	await page.locator("input:visible").fill("mikko");

	expect(await groupTitles.count()).toBe(2);
	await hits.first().waitFor({ state: "visible" });

	const moreLink = page.locator(".findkit--single-group-link");

	await moreLink.first().click();

	await expect.poll(() => groupTitles.count()).toBe(1);

	await page.goBack();
	await moreLink.first().waitFor({ state: "visible" });

	expect(await groupTitles.count()).toBe(2);

	await page.goBack();

	await groupTitles.first().waitFor({ state: "hidden" });
});

test("forward button restores search terms", async ({ page }) => {
	await page.goto(staticEntry("/two-groups"));
	const hits = page.locator(".findkit--hit");
	const input = page.locator("input:visible");

	await page.locator("text=open").click();
	await input.fill("mikko");

	await hits.first().waitFor({ state: "visible" });

	await page.goBack();

	await hits.first().waitFor({ state: "hidden" });

	await page.goForward();

	await hits.first().waitFor({ state: "visible" });
});

test("escape closes the modal", async ({ page }) => {
	await page.goto(staticEntry("/two-groups"));
	const hits = page.locator(".findkit--hit");
	const input = page.locator("input:visible");

	await page.locator("text=open").click();
	await input.fill("mikko");

	await hits.first().waitFor({ state: "visible" });

	await page.keyboard.press("Escape");

	await hits.first().waitFor({ state: "hidden" });
});

test("fetch counts", async ({ page }) => {
	const hits = page.locator(".findkit--hit");

	await page.goto(staticEntry("/two-groups-v2?minTerms=1&noInfiniteScroll=1"));

	await page.evaluate(async () => {
		const anyWindow = window as any;
		anyWindow.COUNT = 0;
		ui.on("fetch", () => {
			anyWindow.COUNT++;
		});
	});

	async function getCount() {
		return await page.evaluate(async () => {
			const anyWindow = window as any;
			return anyWindow.COUNT as number;
		});
	}

	await page.locator("text=open").click();

	await page.waitForLoadState("networkidle");
	expect(await getCount()).toBe(0);

	await page.locator("input:visible").fill("a");

	await hits.first().waitFor({ state: "visible" });

	expect(await getCount()).toBe(1);

	await page.locator(".findkit--single-group-link").first().click();

	await expect.poll(() => getCount()).toBe(2);

	await page.locator(".findkit--load-more-button").first().click();

	await expect.poll(() => getCount()).toBe(3);

	await page.locator(".findkit--back-link").first().click();

	// Eh, could optimize and remove this fetch
	await expect.poll(() => getCount()).toBe(4);
});

test("fetches only once when navigating directly to results", async ({
	page,
}) => {
	const hits = page.locator(".findkit--hit");

	await page.goto(staticEntry("/two-groups"));

	await page.evaluate(async () => {
		const anyWindow = window as any;
		anyWindow.COUNT = 0;
		ui.on("fetch", () => {
			anyWindow.COUNT++;
		});

		await ui.preload();

		history.replaceState(null, "", "?fdk_q=valu&fdk_id=valu");
	});

	async function getCount() {
		return await page.evaluate(async () => {
			const anyWindow = window as any;
			return anyWindow.COUNT as number;
		});
	}

	await hits.first().waitFor({ state: "visible" });

	await page.waitForTimeout(500);

	expect(await getCount()).toBe(1);
});

test("can show 'All results shown' and 'No results' on group view", async ({
	page,
}) => {
	await page.goto(staticEntry("/two-groups"));
	const hits = page.locator(".findkit--hit");
	const input = page.locator("input:visible");
	const group1 = page.locator(".findkit--group").nth(0);
	const group2 = page.locator(".findkit--group").nth(1);

	const firstGroupsHits = group1.locator(".findkit--hit");
	const secondGroupHits = group2.locator(".findkit--hit");

	await page.locator("text=open").click();
	await input.fill("esa-matti");

	await hits.first().waitFor({ state: "visible" });

	// Just assert we have some hits in the first group but less than 5 so the
	// group link will not be show. Also check the second group is empty
	// This is not the test. Just checking we have the right data.
	expect(await firstGroupsHits.count()).toBeGreaterThan(0);
	expect(await firstGroupsHits.count()).toBeLessThan(5);
	await expect(secondGroupHits).toHaveCount(0);

	// Actual assertions
	await expect(group1.locator(".findkit--group-all-results-shown")).toHaveText(
		"All results shown",
	);

	await expect(group2.locator(".findkit--group-all-results-shown")).toHaveText(
		"No results",
	);

	await expect(page.locator(".findkit--content")).not.toHaveText(
		"Show more search results",
	);
});

["no-shadow", "with-shadow"].forEach((qs) => {
	test(`move focus the next item when navigating into a group (${qs})`, async ({
		page,
		browserName,
	}) => {
		const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";

		const getFocusedHitUrl = async () => {
			return await page.evaluate(() => {
				let activeElement = document.activeElement;

				if (activeElement?.shadowRoot instanceof ShadowRoot) {
					activeElement = activeElement.shadowRoot.activeElement;
				}

				if (activeElement instanceof HTMLAnchorElement) {
					return activeElement.href;
				}
			});
		};

		await page.goto(staticEntry(`/two-groups?${qs}`));
		const hitLinks = page.locator("a.findkit--hit-title-link");

		await page.locator("button", { hasText: "open" }).click();

		await page.locator("input").fill("valu");

		await hitLinks.first().waitFor({ state: "visible" });

		await page.keyboard.press(tab);
		await page.keyboard.press(tab);
		await page.keyboard.press(tab);
		await page.keyboard.press(tab);
		await page.keyboard.press(tab);

		const lastPreviewUrl = await getFocusedHitUrl();
		expect(lastPreviewUrl).toBeTruthy();

		// Move to "Show more search results"
		await page.keyboard.press(tab);
		await page.keyboard.press("Enter");

		await expect(hitLinks.nth(5)).toBeFocused();

		expect(lastPreviewUrl).not.toBe(await getFocusedHitUrl());
	});
});
