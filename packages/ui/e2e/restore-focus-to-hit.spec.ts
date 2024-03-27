import { expect, test } from "@playwright/test";
import { routeMocks, scrollToHit, staticEntry } from "./helpers";
declare const MOD: typeof import("../src/cdn-entries/index");

// async function expectFocused2(locator: Locator) {
// 	// WTF: playwright bug? This does not work on chromium but works on firefox and safari
// 	// await expect(locator).toBeFocused();

// 	// Workaround:
// 	await expect
// 		.poll(async () => {
// 			return await locator.evaluate(async (el) => {
// 				const focusedElement =
// 					document.activeElement?.shadowRoot?.activeElement ??
// 					document.activeElement;

// 				return el === focusedElement;
// 			});
// 		})
// 		.toBe(true);
// }

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
});
