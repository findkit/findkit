import { expect, test, Page } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

function hit(overrides: { title: string; url: string }) {
	return {
		score: 10,
		superwordsMatch: false,
		language: "en",
		highlight: "Result <em>highlight</em>",
		domain: "shop.findkit.invalid",
		tags: ["domain/shop.findkit.invalid"],
		created: "2022-01-01T00:00:00.000Z",
		modified: "2022-01-01T00:00:00.000Z",
		customFields: {},
		...overrides,
	};
}

async function mockResponse(
	page: Page,
	response: { hits?: ReturnType<typeof hit>[]; messages?: unknown[] },
) {
	await page.route(
		(url) => url.hostname.endsWith(".findkit.com"),
		async (route) => {
			const hits = response.hits ?? [];
			await route.fulfill({
				json: {
					groups: [{ total: hits.length, duration: 5, hits }],
					duration: 5,
					messages: response.messages ?? [],
				},
			});
		},
	);
}

async function openAndSearch(page: Page, options?: { router?: "hash" }) {
	await page.evaluate(async (options) => {
		const ui = new MOD.FindkitUI({ publicToken: "test", ...options });
		ui.openFrom("#open-button");
		Object.assign(window, { ui });
	}, options ?? {});

	await page.locator("#open-button").click();
	await page.locator("input").fill("test");
}

test.describe("response messages", () => {
	test("keeps the formatting of a message", async ({ page }) => {
		await mockResponse(page, {
			messages: [
				{
					id: "a",
					message:
						'<div style="background-color: #fee1e6; padding: 10px; border: 2px dashed black;">' +
						'<a target="_blank" href="https://www.findkit.com/?from=test">Findkit Search</a> is <b>running</b>.' +
						'<div class="details" style="display: none">Hidden details</div>' +
						"</div>",
				},
			],
		});
		await page.goto(staticEntry("/dummy"));
		await openAndSearch(page);

		const message = page.locator(".findkit--message");
		await expect(message).toContainText("Findkit Search is running.");

		const link = message.locator("a");
		await expect(link).toHaveAttribute(
			"href",
			"https://www.findkit.com/?from=test",
		);
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", "noopener");

		await expect(message.locator("b")).toHaveText("running");
		await expect(message.getByText("Hidden details")).toBeHidden();
		await expect(message.locator("> div")).toHaveCSS(
			"background-color",
			"rgb(254, 225, 230)",
		);
	});

	test("renders only formatting from a message", async ({ page }) => {
		await mockResponse(page, {
			messages: [
				{
					id: "a",
					message:
						"Text before " +
						'<img src="x" onerror="window.didRun = 1">' +
						"<script>window.didRun = 2</script>" +
						'<iframe src="https://shop.findkit.invalid/"></iframe>' +
						'<svg onload="window.didRun = 3"></svg>' +
						"<style>.findkit--message { color: red }</style>" +
						'<span onclick="window.didRun = 4" id="marked" data-x="1">span text</span> ' +
						'<a href="javascript:window.didRun = 5">script link</a> ' +
						'<a href="  JaVa\tScRiPt:window.didRun = 6">odd link</a> ' +
						'<a href="data:text/html,x">data link</a> ' +
						'<a href="/relative">relative link</a> ' +
						'<div style="background-image: url(https://shop.findkit.invalid/x); position: fixed; color: red">styled</div>' +
						'<div style="color: expression(alert(1)); padding: 1px">styled again</div>',
				},
			],
		});
		await page.goto(staticEntry("/dummy"));
		await openAndSearch(page);

		const message = page.locator(".findkit--message");
		await expect(message).toContainText("Text before");
		await expect(message).toContainText("span text");

		await expect(
			message.locator("img, script, iframe, svg, style"),
		).toHaveCount(0);

		const span = message.locator("span");
		await expect(span).not.toHaveAttribute("onclick");
		await expect(span).not.toHaveAttribute("id");
		await expect(span).not.toHaveAttribute("data-x");

		await expect(message.getByText("script link")).not.toHaveAttribute("href");
		await expect(message.getByText("odd link")).not.toHaveAttribute("href");
		await expect(message.getByText("data link")).not.toHaveAttribute("href");
		await expect(message.getByText("relative link")).toHaveAttribute(
			"href",
			"/relative",
		);

		await expect(message.getByText("styled", { exact: true })).toHaveAttribute(
			"style",
			"color: red;",
		);
		await expect(message.getByText("styled again")).toHaveAttribute(
			"style",
			"padding: 1px;",
		);

		await span.click();
		await message.getByText("script link").click();
		await message.getByText("odd link").click();

		expect(await page.evaluate(() => (window as any).didRun)).toBeUndefined();
	});
});

test.describe("hit urls", () => {
	test("links only to web pages", async ({ page }) => {
		await mockResponse(page, {
			hits: [
				hit({ title: "Web hit", url: "https://shop.findkit.invalid/first" }),
				hit({ title: "Script hit", url: "javascript:window.didRun = 1" }),
				hit({ title: "Odd hit", url: " JaVa\tScRiPt:window.didRun = 2" }),
				hit({ title: "Data hit", url: "data:text/html,x" }),
				hit({ title: "Relative hit", url: "/relative" }),
			],
		});
		await page.goto(staticEntry("/dummy"));
		await openAndSearch(page);

		const hits = page.locator(".findkit--hit");
		await expect(hits).toHaveCount(5);

		await expect(
			hits.nth(0).locator("a.findkit--hit-title-link"),
		).toHaveAttribute("href", "https://shop.findkit.invalid/first");

		for (const index of [1, 2, 3, 4]) {
			const links = hits.nth(index).locator("a");
			for (const link of await links.all()) {
				expect(await link.getAttribute("href")).toMatch(/^about:blank/);
			}
		}

		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("ArrowDown");
		await page.keyboard.press("Enter");

		expect(await page.evaluate(() => (window as any).didRun)).toBeUndefined();
	});
});

test.describe("search endpoint", () => {
	for (const router of [undefined, "hash"] as const) {
		test(`is not read from the page url (${
			router ?? "querystring"
		} router)`, async ({ page }) => {
			const hosts = new Set<string>();
			page.on("request", (request) => {
				if (request.method() === "POST") {
					hosts.add(new URL(request.url()).host);
				}
			});

			await mockResponse(page, {});
			await page.route(
				(url) => url.hostname === "other.invalid",
				(route) => route.abort(),
			);

			await page.goto(
				staticEntry("/dummy") +
					"#__findkit_subdomain=other.invalid%2Fx&__findkit_version=z",
			);
			await openAndSearch(page, router ? { router } : undefined);

			await expect(page.locator(".findkit--container")).toBeVisible();
			await expect
				.poll(() => Array.from(hosts))
				.toEqual(["search.findkit.com"]);
		});
	}
});
