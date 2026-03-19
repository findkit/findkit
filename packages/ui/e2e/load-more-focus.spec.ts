import { expect, test } from "@playwright/test";
import { pressTab, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

const firstPageHits = [
	{
		score: 10,
		superwordsMatch: false,
		title: "First Result",
		language: "en",
		url: "https://shop.findkit.invalid/first",
		highlight: "First result highlight",
		domain: "shop.findkit.invalid",
		tags: ["domain/shop.findkit.invalid"],
		created: "2022-01-01T00:00:00.000Z",
		modified: "2022-01-01T00:00:00.000Z",
		customFields: {},
	},
	{
		score: 9,
		superwordsMatch: false,
		title: "Second Result",
		language: "en",
		url: "https://shop.findkit.invalid/second",
		highlight: "Second result highlight",
		domain: "shop.findkit.invalid",
		tags: ["domain/shop.findkit.invalid"],
		created: "2022-01-01T00:00:00.000Z",
		modified: "2022-01-01T00:00:00.000Z",
		customFields: {},
	},
];

const secondPageHits = [
	{
		score: 8,
		superwordsMatch: false,
		title: "Third Result",
		language: "en",
		url: "https://shop.findkit.invalid/third",
		highlight: "Third result highlight",
		domain: "shop.findkit.invalid",
		tags: ["domain/shop.findkit.invalid"],
		created: "2022-01-01T00:00:00.000Z",
		modified: "2022-01-01T00:00:00.000Z",
		customFields: {},
	},
	{
		score: 7,
		superwordsMatch: false,
		title: "Fourth Result",
		language: "en",
		url: "https://shop.findkit.invalid/fourth",
		highlight: "Fourth result highlight",
		domain: "shop.findkit.invalid",
		tags: ["domain/shop.findkit.invalid"],
		created: "2022-01-01T00:00:00.000Z",
		modified: "2022-01-01T00:00:00.000Z",
		customFields: {},
	},
];

function mockPaginatedResponses(page: import("@playwright/test").Page) {
	return page.route(
		(url) =>
			url.hostname === "search.findkit.com" && !url.searchParams.has("warmup"),
		async (route, request) => {
			const body = request.postDataJSON() as {
				groups: Array<{ from?: number }>;
			};
			const from = body?.groups?.[0]?.from ?? 0;

			if (from === 0) {
				await route.fulfill({
					json: {
						groups: [{ total: 4, duration: 5, hits: firstPageHits }],
						duration: 5,
						messages: [],
					},
				});
			} else {
				await route.fulfill({
					json: {
						groups: [{ total: 4, duration: 5, hits: secondPageHits }],
						duration: 5,
						messages: [],
					},
				});
			}
		},
	);
}

test.describe("load more button focus management", () => {
	test("keyboard cursor: moves focus to first new result on ArrowDown past last hit", async ({
		page,
	}) => {
		await mockPaginatedResponses(page);
		await page.goto(staticEntry("/dummy"));

		await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "test",
				minTerms: 1,
				infiniteScroll: false,
			});
			ui.openFrom("#open-button");
			Object.assign(window, { ui });
		});

		await page.locator("button").click();
		const input = page.locator("input");
		await input.fill("a");

		const hits = page.locator(".findkit--hit");
		await hits.first().waitFor({ state: "visible" });
		await expect(hits).toHaveCount(2);

		// ArrowDown to the last hit — peek sees load-more-button, triggers searchMore
		await page.keyboard.down("ArrowDown");
		await page.keyboard.down("ArrowDown");

		// Wait for new results to appear
		await expect(hits).toHaveCount(4);

		// The third hit (first new result) should be focused
		const thirdHitLink = page
			.locator(".findkit--hit a.findkit--hit-title-link")
			.nth(2);
		await expect(thirdHitLink).toBeFocused();
	});

	test("tab navigation: moves focus to first new result when button activated via Enter", async ({
		page,
	}) => {
		await mockPaginatedResponses(page);
		await page.goto(staticEntry("/dummy"));

		await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "test",
				minTerms: 1,
				infiniteScroll: false,
			});
			ui.openFrom("#open-button");
			Object.assign(window, { ui });
		});

		await page.locator("button").click();
		const input = page.locator("input");
		await input.fill("a");

		const hits = page.locator(".findkit--hit");
		await hits.first().waitFor({ state: "visible" });
		await expect(hits).toHaveCount(2);

		// Tab through: input → hit 1 title → hit 2 title → load more button
		await pressTab(page);
		await pressTab(page);
		await pressTab(page);

		const loadMoreButton = page.locator(".findkit--load-more-button");
		await expect(loadMoreButton).toBeFocused();

		// Activate via keyboard
		await page.keyboard.press("Enter");

		// Wait for new results
		await expect(hits).toHaveCount(4);

		// The third hit (first new result) should be focused
		const thirdHitLink = page
			.locator(".findkit--hit a.findkit--hit-title-link")
			.nth(2);
		await expect(thirdHitLink).toBeFocused();
	});

	test("does not move focus when load more is clicked with mouse", async ({
		page,
	}) => {
		await mockPaginatedResponses(page);
		await page.goto(staticEntry("/dummy"));

		await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "test",
				minTerms: 1,
				infiniteScroll: false,
			});
			ui.openFrom("#open-button");
			Object.assign(window, { ui });
		});

		await page.locator("button").click();
		const input = page.locator("input");
		await input.fill("a");

		const hits = page.locator(".findkit--hit");
		await hits.first().waitFor({ state: "visible" });
		await expect(hits).toHaveCount(2);

		// Click load more with mouse (no keyboard navigation active)
		const loadMoreButton = page.locator(".findkit--load-more-button");
		await loadMoreButton.click();

		// Wait for new results
		await expect(hits).toHaveCount(4);

		// Focus should NOT be on the third hit
		const thirdHitLink = page
			.locator(".findkit--hit a.findkit--hit-title-link")
			.nth(2);
		await expect(thirdHitLink).not.toBeFocused();
	});

	test("skip highlights button focuses load more button on last result", async ({
		page,
	}) => {
		const hitsWithHighlightLinks = [
			{
				score: 10,
				superwordsMatch: false,
				title: "First Result",
				language: "en",
				url: "https://shop.findkit.invalid/first",
				highlight: "result <em>highlight</em> one",
				domain: "shop.findkit.invalid",
				tags: ["domain/shop.findkit.invalid"],
				created: "2022-01-01T00:00:00.000Z",
				modified: "2022-01-01T00:00:00.000Z",
				customFields: {},
			},
			{
				score: 9,
				superwordsMatch: false,
				title: "Second Result",
				language: "en",
				url: "https://shop.findkit.invalid/second",
				highlight: "result <em>highlight</em> two",
				domain: "shop.findkit.invalid",
				tags: ["domain/shop.findkit.invalid"],
				created: "2022-01-01T00:00:00.000Z",
				modified: "2022-01-01T00:00:00.000Z",
				customFields: {},
			},
		];

		await page.route(
			(url) =>
				url.hostname === "search.findkit.com" &&
				!url.searchParams.has("warmup"),
			async (route) => {
				await route.fulfill({
					json: {
						groups: [
							{
								total: 4,
								duration: 5,
								hits: hitsWithHighlightLinks,
							},
						],
						duration: 5,
						messages: [],
					},
				});
			},
		);

		await page.goto(staticEntry("/dummy"));

		await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "test",
				minTerms: 1,
				infiniteScroll: false,
			});
			ui.openFrom("#open-button");
			Object.assign(window, { ui });
		});

		await page.locator("button").click();
		const input = page.locator("input");
		await input.fill("a");

		const hits = page.locator(".findkit--hit");
		await hits.first().waitFor({ state: "visible" });
		await expect(hits).toHaveCount(2);

		// Focus the skip-highlights button on the last hit and press Enter
		const lastHitSkipButton = hits
			.nth(1)
			.locator(".findkit--skip-highlights");
		await lastHitSkipButton.focus();
		await page.keyboard.press("Enter");

		// Load more button should be focused, not the input
		const loadMoreButton = page.locator(".findkit--load-more-button");
		await expect(loadMoreButton).toBeFocused();
	});
});
