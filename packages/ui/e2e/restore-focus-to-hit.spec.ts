import { chromium, expect, test } from "@playwright/test";
import {
	mockSearchResponses,
	routeMocks,
	scrollToHit,
	staticEntry,
} from "./helpers";
declare const MOD: typeof import("../src/cdn-entries/index");

test.describe("focuses the input when coming back to search results", () => {
	test("in single group", async ({ page }) => {
		await routeMocks(page);
		await page.goto(staticEntry("/single-group-v2"));

		const input = page.locator("input");

		await page.locator("button").click();
		await input.fill("a");

		const hitContainer = await scrollToHit(page, "Running Shoes");
		const theHit = hitContainer.locator("a").first();

		await theHit.click();

		await page.waitForLoadState("domcontentloaded");

		await page.goBack();

		await page.waitForLoadState("domcontentloaded");

		await expect(theHit).toBeFocused();

		await page.reload();

		await expect(input).toBeFocused();
	});

	test("in multiple groups", async ({ page }) => {
		await routeMocks(page);
		await page.goto(staticEntry("/two-groups-v2?minTerms=1"));

		const input = page.locator("input");
		const hits = page
			.locator(".findkit--group")
			.nth(1)
			.locator(".findkit--hit");

		const third = hits.nth(3).locator("a").first();

		await page.locator("button").click();
		await input.fill("a");

		await third.click();

		await page.waitForLoadState("domcontentloaded");

		await page.goBack();

		await page.waitForLoadState("domcontentloaded");

		await expect(third).toBeFocused();

		await page.reload();

		await expect(input).toBeFocused();
	});

	test("in a selected groups", async ({ page }) => {
		await routeMocks(page);
		await page.goto(staticEntry("/two-groups-v2?minTerms=1"));
		await page.locator("button").click();

		const input = page.locator("input");
		await input.fill("a");
		await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

		await page.locator("text=Show more search results").first().click();

		const hitContainer = await scrollToHit(page, "Wooden Photo Frame");
		const theHit = hitContainer.locator("a").first();
		await theHit.click();

		await page.waitForLoadState("domcontentloaded");

		await page.goBack();

		await page.waitForLoadState("domcontentloaded");

		await expect(theHit).toBeFocused();

		await page.reload();

		await expect(input).toBeFocused();
	});

	test("custom link is also handled", async ({ page }) => {
		await routeMocks(page);
		await page.goto(staticEntry("/dummy"));

		const createUI = async () => {
			await page.evaluate(async () => {
				const { FindkitUI, html } = MOD;

				const ui = new FindkitUI({
					publicToken: "pW1D0p0Dg",
					minTerms: 0,
					slots: {
						Hit(props) {
							return html`
								<a class="custom" href="${props.hit.url}">Custom Link</a>
							`;
						},
					},
				});

				ui.openFrom("#open-button");
			});
		};

		await createUI();

		await page.locator("button").click();
		const input = page.locator("input");

		await input.fill("a");

		const hit = page.locator(".custom").nth(2);

		await hit.click();

		await page.waitForLoadState("domcontentloaded");

		await page.goBack();

		await createUI();

		await page.waitForLoadState("domcontentloaded");

		await expect(hit).toBeFocused();

		await page.reload();

		await createUI();

		await expect(input).toBeFocused();
	});

	test("highlight link restores too", async ({ page }) => {
		await routeMocks(page);
		await page.goto(staticEntry("/single-group-v2"));

		const input = page.locator("input");

		await page.locator("button").click();
		await input.fill("a");

		const hitContainer = await scrollToHit(page, "Running Shoes");

		const titleLink = hitContainer.locator("a").first();
		const emLink = hitContainer.locator(".findkit--em").first();

		await emLink.click();

		await page.waitForLoadState("domcontentloaded");

		await page.goBack();

		await page.waitForLoadState("domcontentloaded");

		await expect(titleLink).toBeFocused();

		await page.reload();

		await expect(input).toBeFocused();
	});

	test("with custom container", async ({ page }) => {
		await routeMocks(page);
		await mockSearchResponses(page);
		await page.goto(staticEntry("/custom-container"));

		const input = page.locator("input");

		await input.fill("test");

		const hit = page.locator(".findkit--hit-title-link").nth(2);

		await hit.click();

		await page.waitForLoadState("domcontentloaded");

		await page.goBack();

		await page.waitForLoadState("domcontentloaded");

		await expect(hit).toBeFocused();

		await page.reload();

		await hit.waitFor({ state: "visible" });

		// Custom container should not focus the input
		await expect(hit).not.toBeFocused();
		await expect(input).not.toBeFocused();
	});

	test("with back/forward cache (bfcache) enabled", async ({ browser }) => {
		if (browser.browserType().name() !== "chromium") {
			return;
		}

		const browser2 = await chromium.launch({
			ignoreDefaultArgs: ["--disable-back-forward-cache"],
		});

		const page = await browser2.newPage();

		await routeMocks(page);
		await mockSearchResponses(page);
		await page.goto(staticEntry("/single-group-v2"));

		await page.locator("button").click();

		const input = page.locator("input");

		await input.fill("test");

		const hit = page.locator(".findkit--hit-title-link").nth(2);

		await hit.click();

		await page.waitForLoadState("domcontentloaded");

		await page.goBack();

		await page.waitForLoadState("domcontentloaded");

		await expect(hit).toBeFocused();

		await page.reload();

		await hit.waitFor({ state: "visible" });

		await expect(hit).not.toBeFocused();
		await expect(input).toBeFocused();
	});
});
