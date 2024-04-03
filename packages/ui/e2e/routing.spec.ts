import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can use memory routing", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			router: "memory",
			params: {
				tagQuery: [],
			},
		});

		ui.open("valu");
	});

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');

	await hits.first().waitFor({ state: "visible" });
	await expect(page).not.toHaveURL(/fdk\.q/);

	const firstResults = await hits.first().textContent();

	await input.fill("wordpress");

	await expect(hits.first()).not.toHaveText(firstResults!);
	await expect(page).not.toHaveURL(/fdk\.q/);
});

test("can open modal from link", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		document.querySelector("button")?.remove();

		const a = document.createElement("a");
		a.href = "bad";
		a.className = "link-open";
		a.innerText = "Link";
		document.body.appendChild(a);

		ui.openFrom(".link-open");

		Object.assign(window, { ui });
	});

	const link = page.locator("text=Link");
	await link.click();

	const input = page.locator('[aria-label="Search input"]');
	await input.fill("valu");
	await expect(page.locator(".findkit--hit").first()).toBeVisible();

	await expect(page).not.toHaveURL(/bad/);
});

test("can cmd links", async ({ page, context }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		document.querySelector("button")?.remove();

		const a = document.createElement("a");
		a.href = "new-page";
		a.className = "link-open";
		a.innerText = "Link";
		document.body.appendChild(a);

		ui.openFrom(".link-open");

		Object.assign(window, { ui });
	});

	const link = page.locator("text=Link");

	if (process.platform === "darwin") {
		await link.click({ modifiers: ["Meta"] });
	} else {
		await link.click({ modifiers: ["Control"] });
	}

	await expect.poll(() => context.pages()).toHaveLength(2);
});

test("updates from history.pushState()", async ({ page, browserName }) => {
	const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
	await page.goto(staticEntry("/dummy"));

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		ui.open("valu");
	});

	await hits.first().waitFor({ state: "visible" });
	const result1 = await hits
		.first()
		.evaluate((e: HTMLElement) => e.getAttribute("href"));

	await page.keyboard.press(tab);

	await page.evaluate(async () => {
		history.pushState(undefined, "", "?fdk.q=wordpress");
	});

	await expect
		.poll(() => {
			return hits.first().evaluate((e: any) => e.getAttribute("href"));
		})
		.not.toBe(result1);

	await expect(input).toHaveValue("wordpress");
});

test("modal updates url", async ({ page }) => {
	await page.route("/start", (route) => {
		void route.fulfill({
			status: 200,
			contentType: "text/html",
			body: "<html><body><h1>Hello World</h1></body></html>",
		});
	});

	await page.goto("/start");

	await page.waitForLoadState("domcontentloaded");

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 1,
			groups: [
				{
					title: "All",
				},
				{
					title: "Electronics",
					params: {
						filter: {
							category: "Electronics",
						},
					},
				},
			],
		});

		ui.open("a");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect.poll(() => new URL(page.url()).search).toEqual("?fdk.q=a");

	const allLink = page.locator("text=Show more search results");
	await allLink.first().click();

	await expect
		.poll(() => new URL(page.url()).search)
		.toEqual("?fdk.q=a&fdk.id=group-1");

	await page.goBack();

	await expect.poll(() => new URL(page.url()).search).toEqual("?fdk.q=a");

	await page.goBack();

	await expect.poll(() => new URL(page.url()).search).toEqual("");
	await expect
		.poll(() => new URL(page.url()).pathname)
		.toEqual("/static/dummy");

	await page.goBack();

	await expect.poll(() => new URL(page.url()).search).toEqual("");
	await expect.poll(() => new URL(page.url()).pathname).toEqual("/start");
});

test("container only replaces the url", async ({ page }) => {
	await page.route("/start", (route) => {
		void route.fulfill({
			status: 200,
			contentType: "text/html",
			body: "<html><body><h1>Hello World</h1></body></html>",
		});
	});

	await page.goto("/start");

	await page.waitForLoadState("domcontentloaded");

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const div = document.createElement("div");
		document.body.appendChild(div);
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 1,
			modal: false,
			container: div,
			groups: [
				{
					title: "All",
				},
				{
					title: "Electronics",
					params: {
						filter: {
							category: "Electronics",
						},
					},
				},
			],
		});

		ui.open("a");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect.poll(() => new URL(page.url()).search).toEqual("?fdk.q=a");

	const allLink = page.locator("text=Show more search results");
	await allLink.first().click();

	await expect
		.poll(() => new URL(page.url()).search)
		.toEqual("?fdk.q=a&fdk.id=group-1");

	// No history updates. Back button moves used to back the initial /start page
	await page.goBack();
	await expect.poll(() => new URL(page.url()).search).toEqual("");
	await expect.poll(() => new URL(page.url()).pathname).toEqual("/start");
});
