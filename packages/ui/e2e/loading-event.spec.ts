import { expect, test } from "@playwright/test";
import { slowDownSearch, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test("emit only one loading/loading-done event when implementation and search is slow", async ({
	page,
}) => {
	await page.route(
		(url) => url.pathname.endsWith("implementation.js"),
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (route) => {
			await new Promise((f) => setTimeout(f, 500));
			await route.continue();
		},
	);

	await slowDownSearch(page, 500);

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			loadingThrottle: 200,
		});

		const uiEvents: string[] = [];

		Object.assign(window, { ui, uiEvents });

		const events = [
			"open",
			"loaded",
			"request-open",
			"fetch",
			"fetch-done",
			"loading",
			"loading-done",
		] as const;

		events.forEach((event) => {
			ui.on(event, () => {
				uiEvents.push(event);
			});
		});

		ui.open("boots");
	});

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });

	const events = await page.evaluate(() => {
		return (window as any).uiEvents;
	});

	expect(events).toEqual([
		"request-open",
		"loading",
		"loaded",
		"open",
		"fetch",
		"fetch-done",
		"loading-done",
	]);
});

test("no loading event when the code and search loads fast", async ({
	page,
}) => {
	await page.route(
		(url) => url.hostname === "search.findkit.com",
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (route) => {
			await route.fulfill({ json: mockResponse });
		},
	);

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			loadingThrottle: 200,
		});

		const uiEvents: string[] = [];

		Object.assign(window, { ui, uiEvents });

		const events = [
			"open",
			"request-open",
			"fetch",
			"loaded",
			"fetch-done",
			"loading",
			"loading-done",
		] as const;

		events.forEach((event) => {
			ui.on(event, () => {
				uiEvents.push(event);
			});
		});

		ui.open("boots");
	});

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });

	const events = await page.evaluate(() => {
		return (window as any).uiEvents;
	});

	expect(events).toEqual([
		"request-open",
		"loaded",
		"open",
		"fetch",
		"fetch-done",
	]);
});

test("multiple sequential searches cause only once loading/loading-done", async ({
	page,
}) => {
	await slowDownSearch(page, 500);

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			fetchThrottle: 300,
		});

		const uiEvents: string[] = [];

		Object.assign(window, { ui, uiEvents });

		const events = ["fetch", "fetch-done", "loading", "loading-done"] as const;

		events.forEach((event) => {
			ui.on(event, () => {
				uiEvents.push(event);
			});
		});

		ui.open();
	});

	await page
		.locator("input")
		.pressSequentially("leather boots", { delay: 100 });

	await page.waitForLoadState("networkidle");

	const events = await page.evaluate(() => {
		return (window as any).uiEvents as string[];
	});

	// Single loading event
	expect(events.filter((e) => e === "loading").length).toEqual(1);

	// Multiple fetches
	expect(events.filter((e) => e === "fetch").length).toBeGreaterThan(2);
	expect(events.filter((e) => e === "fetch-done").length).toBeGreaterThan(2);

	// Ends with single loading-done
	expect(events.filter((e) => e === "loading-done").length).toEqual(1);
	expect(events.at(-1)).toEqual("loading-done");
});

test("loading event can fire twice", async ({ page }) => {
	await slowDownSearch(page, 500);

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			loadingThrottle: 200,
		});

		const uiEvents: string[] = [];

		Object.assign(window, { ui, uiEvents });

		const events = ["loading", "loading-done"] as const;

		events.forEach((event) => {
			ui.on(event, () => {
				uiEvents.push(event);
			});
		});

		ui.open("boots");
	});

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });

	await page.evaluate(async () => {
		ui.open("leather boots");
	});

	await expect
		.poll(async () => {
			return await page.evaluate(() => {
				return (window as any).uiEvents as string[];
			});
		})
		.toEqual(["loading", "loading-done", "loading", "loading-done"]);
});

const mockResponse = {
	groups: [
		{
			total: 3,
			duration: 9,
			hits: [
				{
					score: 32.833023,
					superwordsMatch: false,
					title: "Suede Boots",
					language: "en",
					url: "https://shop.findkit.invalid/en/clothing/suede-boots",
					highlight:
						"These suede <em>boots</em> provide both comfort and style. They&#x27;re crafted from high-quality suede and have a durable sole for long-lasting wear.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/clothing",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-10-20T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.350Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Clothing",
						},
						weight: {
							type: "number",
							value: 1,
						},
						price: {
							type: "number",
							value: 100,
						},
						quantity: {
							type: "number",
							value: 0,
						},
					},
				},
				{
					score: 32.833023,
					superwordsMatch: false,
					title: "Leather Boots",
					language: "en",
					url: "https://shop.findkit.invalid/en/clothing/leather-boots",
					highlight:
						"Western-inspired <em>boots</em> crafted in chrome-free leather with pointed toes and angled heels. Featuring soft shafts made from stretch nappa, finished with concealed zippers on the inside.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/clothing",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-10-26T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.689Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Clothing",
						},
						weight: {
							type: "number",
							value: 1,
						},
						price: {
							type: "number",
							value: 220,
						},
						quantity: {
							type: "number",
							value: 4,
						},
					},
				},
				{
					score: 32.833023,
					superwordsMatch: false,
					title: "Rubber Boots",
					language: "en",
					url: "https://shop.findkit.invalid/en/clothing/rubber-boots",
					highlight:
						"Rubber <em>boots</em> which will keep your feet dry even int the heaviest rain",
					domain: "shop.findkit.invalid",
					tags: [
						"category/clothing",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-10-20T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.818Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Clothing",
						},
						weight: {
							type: "number",
							value: 1,
						},
						price: {
							type: "number",
							value: 30,
						},
						quantity: {
							type: "number",
							value: 34,
						},
					},
				},
			],
		},
	],
	duration: 31,
	messages: [],
};
