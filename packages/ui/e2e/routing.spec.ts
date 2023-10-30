import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

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
			modal: false,
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

	await expect.poll(() => new URL(page.url()).search).toEqual("?fdk_q=a");

	const allLink = page.locator("text=Show more search results");
	await allLink.first().click();

	await expect
		.poll(() => new URL(page.url()).search)
		.toEqual("?fdk_q=a&fdk_id=group-1");

	await page.goBack();

	await expect.poll(() => new URL(page.url()).search).toEqual("?fdk_q=a");

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

	await expect.poll(() => new URL(page.url()).search).toEqual("?fdk_q=a");

	const allLink = page.locator("text=Show more search results");
	await allLink.first().click();

	await expect
		.poll(() => new URL(page.url()).search)
		.toEqual("?fdk_q=a&fdk_id=group-1");

	// No history updates. Back button moves used to back the initial /start page
	await page.goBack();
	await expect.poll(() => new URL(page.url()).search).toEqual("");
	await expect.poll(() => new URL(page.url()).pathname).toEqual("/start");
});
