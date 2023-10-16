import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test("can filter and sort (1)", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pJMDjpYOE",
			searchEndpoint:
				"https://staging---search.findkit.com/c/pJMDjpYOE/search?p=pJMDjpYOE",
			params: {
				filter: {
					price: {
						$lt: 200,
					},
				},
				sort: {
					price: {
						$order: "desc",
					},
				},
			},
			slots: {
				Hit(props) {
					return html`${props.hit.customFields.price?.value}`;
				},
			},
		});

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const prices = await hits.allInnerTexts();
	expect(prices).toEqual(["100", "30"]);
});

test("can filter and sort (2)", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pJMDjpYOE",
			searchEndpoint:
				"https://staging---search.findkit.com/c/pJMDjpYOE/search?p=pJMDjpYOE",
			params: {
				filter: {
					price: {
						$gt: 50,
					},
				},
				sort: {
					price: {
						$order: "asc",
					},
				},
			},
			slots: {
				Hit(props) {
					return html`${props.hit.customFields.price?.value}`;
				},
			},
		});

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const prices = await hits.allInnerTexts();
	expect(prices).toEqual(["100", "220"]);
});

test("can dynamically update filter", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pJMDjpYOE",
			searchEndpoint:
				"https://staging---search.findkit.com/c/pJMDjpYOE/search?p=pJMDjpYOE",
			params: {
				sort: {
					price: {
						$order: "asc",
					},
				},
			},
			slots: {
				Hit(props) {
					return html`${props.hit.customFields.price?.value}`;
				},
			},
		});
		Object.assign(window, { ui });

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const prices = await hits.allInnerTexts();
	expect(prices).toEqual(["30", "100", "220"]);

	await page.evaluate(async () => {
		ui.updateParams((params) => {
			params.filter = {
				price: { $lt: 50 },
			};
		});
	});

	await expect.poll(async () => await hits.allInnerTexts()).toEqual(["30"]);
});
