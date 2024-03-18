import test, { Page } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries";
import type { FindkitUIEvents } from "../src/emitter";

declare const ui: FindkitUI;

export function fixFirefoxTab() {
	test.use({
		launchOptions: async ({ launchOptions }, use) => {
			await use({
				...launchOptions,
				// Enable tab focusable links in firefox
				// Also enable from macos settings:
				// https://stackoverflow.com/a/74790182/153718
				firefoxUserPrefs: {
					"accessibility.tabfocus": 7,
				},
			});
		},
	});
}
export async function getHitHosts(page: Page) {
	const hits = page.locator(".findkit--hit a");
	await hits.first().waitFor({ state: "visible" });

	const hrefs = await hits.evaluateAll((list) => {
		return list.flatMap((el) => {
			if (el instanceof HTMLAnchorElement) {
				return el.href;
			}
			return [];
		});
	});

	const hosts = new Set(hrefs.map((url) => new URL(url).hostname));
	return Array.from(hosts);
}

export async function slowDownSearch(page: Page, ms: number) {
	await page.route(
		(url) => url.hostname === "search.findkit.com",
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (route) => {
			await new Promise((f) => setTimeout(f, ms));
			await route.continue();
		},
	);
}

/**
 * Awaits for an event to be emitted by the Findkit UI and returns the event.
 */
export async function oneEvent<EventName extends keyof FindkitUIEvents>(
	page: Page,
	eventName: EventName,
): Promise<FindkitUIEvents[EventName]> {
	return await page.evaluate(async (eventName) => {
		return await new Promise<any>((resolve) => {
			const off = ui.on(eventName, (e) => {
				off();
				resolve(e);
			});
		});
	}, eventName);
}

export async function getScrollPosition(page: Page) {
	return await page.evaluate(() => {
		return (
			document
				.querySelector(".findkit--host")
				?.shadowRoot?.querySelector(".findkit--modal")?.scrollTop ?? -1
		);
	});
}

export function viteEntry(entry: string) {
	if (process.env.CI) {
		return `http://localhost:28104/dist/vite/${entry}`;
	}

	return `http://127.0.0.1:5173/vite/${entry}.html`;
}

export function staticEntry(entry: string) {
	if (entry.startsWith("/")) {
		entry = entry.slice(1);
	}
	return `http://localhost:28104/static/${entry}`;
}

export function delayer() {
	let saved: () => void = () => {};

	return {
		now() {
			saved();
		},
		what(fn: () => void) {
			saved = fn;
		},
	};
}

/**
 *  Got to a page and await for an async function before the page is fully loaded.
 */
export async function gotoWithEarlyHook<T>(
	page: Page,
	path: string,
	onEarlyLoad: () => Promise<T>,
): Promise<T> {
	const delay = delayer();

	// Prevent findkit js from loading so we can inject test js before it
	await page.route(
		(url) => url.pathname.endsWith("index.js"),
		(route) => {
			delay.what(() => {
				void route.continue();
			});
		},
	);

	await page.goto(staticEntry(path), {
		waitUntil: "commit",
	});

	const res = await onEarlyLoad();

	// Allow findkit js to load once our test js has been injected
	delay.now();

	await page.waitForLoadState("load");

	return res;
}

export async function pressTab(page: Page, options?: { shift?: boolean }) {
	const browserName = page.context().browser()?.browserType().name();

	const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";

	if (options?.shift) {
		await page.keyboard.press(`Shift+${tab}`);
	} else {
		await page.keyboard.press(tab);
	}
}

export async function mockSearchResponses(page: Page) {
	await page.route(
		(url) => url.hostname === "search.findkit.com",
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (route) => {
			await route.fulfill({ json: mockResponse });
		},
	);
}

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
				{
					score: 22.833023,
					superwordsMatch: false,
					title: "Kumikengät",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/vaatteet/kumikenkat",
					highlight:
						"Kumiset <em>kengät</em> pitävät jalat kuivina myös rankkasateessa",
					domain: "shop.findkit.invalid",
					tags: [
						"category/clothing",
						"language/fi",
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
