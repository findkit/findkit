import { expect, test } from "@playwright/test";
import { mockSearchResponses, routeMocks, staticEntry } from "./helpers";
declare const MOD: typeof import("../src/cdn-entries/index");

test.describe("shift+enter focuses the first search hit", () => {
	test("in single group", async ({ page }) => {
		await routeMocks(page);
		await mockSearchResponses(page);
		await page.goto(staticEntry("/single-group-v2"));

		const input = page.locator("input");
		const hit = page.locator(".findkit--hit a").first();

		await page.locator("button").click();
		await input.fill("a");
		await hit.waitFor({ state: "visible" });

		await page.keyboard.press("Shift+Enter");

		await expect(hit).toBeFocused();
	});

	test("in a selected group", async ({ page }) => {
		await routeMocks(page);
		await mockSearchResponses(page);

		await page.goto(staticEntry("/two-groups-v2?minTerms=1"));
		await page.locator("button").click();

		const input = page.locator("input");
		const hit = page.locator(".findkit--hit a").first();

		await input.fill("a");
		await hit.waitFor({ state: "visible" });

		await page.locator("text=Show more search results").first().click();

		await page.locator("text=Back").waitFor({ state: "visible" });

		await input.focus();

		await page.keyboard.press("Shift+Enter");

		await expect(hit).toBeFocused();
	});

	test("custom link is also handled", async ({ page }) => {
		await routeMocks(page);
		await mockSearchResponses(page);
		await page.goto(staticEntry("/dummy"));

		await page.evaluate(async () => {
			const { FindkitUI, html } = MOD;

			const ui = new FindkitUI({
				publicToken: "test",
				minTerms: 1,
				slots: {
					Header(props) {
						return html`
							${props.children}
							<a class="custom" href="">Wrong link</a>
						`;
					},
					Hit(props) {
						return html`
							<a class="custom" href="${props.hit.url}">Custom Link</a>
						`;
					},
				},
			});

			ui.openFrom("#open-button");
		});

		await page.locator("button").click();

		const input = page.locator("input");
		const hit = page.locator(".findkit--hit a").first();

		await input.fill("a");
		await hit.waitFor({ state: "visible" });

		await page.keyboard.press("Shift+Enter");

		await expect(hit).toBeFocused();
	});
});
