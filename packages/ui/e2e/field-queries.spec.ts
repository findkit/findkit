import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test("can filter and sort (1)", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			searchEndpoint:
				"https://search.findkit.com/n/pW1D0p0Dg/search?p=pW1D0p0Dg",
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
			publicToken: "pW1D0p0Dg",
			searchEndpoint:
				"https://search.findkit.com/n/pW1D0p0Dg/search?p=pW1D0p0Dg",
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
			publicToken: "pW1D0p0Dg",
			searchEndpoint:
				"https://search.findkit.com/n/pW1D0p0Dg/search?p=pW1D0p0Dg",
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

test("can save filters to url and restore them on reload", async ({ page }) => {
	await page.goto(staticEntry("/custom-field-queries"));

	const getFetches = async (): Promise<string[]> => {
		return await page.evaluate(async () =>
			(window as any).fetches.map((f: any) => f.terms),
		);
	};

	const getPrices = async (): Promise<string[]> =>
		page.locator(".price").allInnerTexts();

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	// First search with no terms
	expect(await getFetches()).toEqual([""]);

	await page.getByLabel("Keywords").fill("boots");
	await expect.poll(getFetches).toEqual(["", "boots"]);

	await page.getByLabel("Most expensive first").check();
	await expect.poll(getPrices).toEqual(["220", "100", "30"]);
	expect(await getFetches()).toEqual(["", "boots", "boots"]);
	expect(page.url()).toContain("fdk.c.sort=price_desc");

	await page.getByLabel("Cheapest first").check();
	await expect.poll(getPrices).toEqual(["30", "100", "220"]);
	expect(await getFetches()).toEqual(["", "boots", "boots", "boots"]);
	expect(page.url()).toContain("fdk.c.sort=price_asc");

	// Can restore the form state and return the same results
	await page.reload();
	await expect(page.getByLabel("Cheapest first")).toBeChecked();
	await expect.poll(getPrices).toEqual(["30", "100", "220"]);
	expect(await getFetches()).toEqual(["boots"]);
});

test("customRouterData events (1)", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			searchEndpoint:
				"https://search.findkit.com/n/pW1D0p0Dg/search?p=pW1D0p0Dg",
		});
		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("fetch-done", () => {
			uiEvents.push("fetch-done");
		});

		ui.customRouterData({
			init: {
				myData: "initial",
			},

			load(data) {
				uiEvents.push("load:" + data.myData);
			},

			save() {
				uiEvents.push("save");
				return {
					myData: "initial",
				};
			},
		});

		ui.open("boots");
	});

	const getEvents = async (): Promise<string[]> => {
		return await page.evaluate(async () => (window as any).uiEvents);
	};

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	expect(await getEvents()).toEqual([
		// Initial load
		"load:initial",

		// Search "boots", moving  fdk_q to the url and saving
		"save",

		// fetch from "boots" search
		"fetch-done",
	]);
});

test("customRouterData events (2)", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			searchEndpoint:
				"https://search.findkit.com/n/pW1D0p0Dg/search?p=pW1D0p0Dg",
			slots: {
				Hit(props) {
					return props.hit.customFields.price?.value;
				},
			},
		});

		const input = document.createElement("input");
		input.type = "text";
		input.id = "max";
		document.body.appendChild(input);

		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("fetch-done", () => {
			uiEvents.push("fetch-done");
		});

		ui.customRouterData({
			init: {
				max: "",
			},

			load(data) {
				input.value = data.max;
				uiEvents.push("load:" + data.max);
			},

			save() {
				uiEvents.push("save:" + input.value);
				return {
					max: input.value,
				};
			},
		});

		ui.open("boots");
	});

	const getEvents = async (): Promise<string[]> => {
		return await page.evaluate(async () => (window as any).uiEvents);
	};

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	expect(await getEvents()).toEqual([
		// initial, empty input -> empty load
		"load:",

		// Save intial values to url
		"save:",

		// fetch-done from "boots" search
		"fetch-done",
	]);

	await page.evaluate(async () => {
		(document.getElementById("max") as HTMLInputElement).value = "100";
		(window as any).uiEvents.length = 0;

		ui.updateParams((params) => {
			params.filter = { price: { $lt: 50 } };
		});
	});

	await expect
		.poll(async () => {
			return hits.allInnerTexts();
		})
		.toEqual(["30"]);

	// updateParams triggers save and fetch-done from the update
	expect(await getEvents()).toEqual(["save:100", "fetch-done"]);
});
