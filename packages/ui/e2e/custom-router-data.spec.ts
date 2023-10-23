import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test("customRouterData events (1)", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
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

test("can serialize data directly from params to customRouteData", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI<{
			params: {
				filter: {
					price: { $lt: number };
				};
			};
		}>({
			publicToken: "pW1D0p0Dg",
			params: {
				filter: {
					price: { $lt: 999 },
				},
			},
		});

		Object.assign(window, { ui });

		ui.customRouterData({
			init: {
				price: String(ui.params.filter?.price.$lt),
			},

			load(data) {
				ui.updateParams((params) => {
					params.filter = {
						price: { $lt: Number(data.price) },
					};
				});
			},

			save() {
				return {
					price: String(ui.params.filter?.price.$lt),
				};
			},
		});

		ui.open("boots");
	});

	await expect.poll(async () => page.url()).toContain("fdk.c.price=999");

	await page.evaluate(async () => {
		ui.updateParams((params) => {
			params.filter.price = { $lt: 100 };
		});
	});

	await expect.poll(async () => page.url()).toContain("fdk.c.price=100");

	await page.reload();
	await page.waitForLoadState("domcontentloaded");

	await expect.poll(async () => page.url()).toContain("fdk.c.price=100");
});

test("can change back to previous custom router data", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI<{
			params: {
				filter: {
					price: { $lt: number };
				};
			};
		}>({
			publicToken: "pW1D0p0Dg",
			params: {
				filter: {
					price: { $lt: 999 },
				},
			},
		});

		Object.assign(window, { ui });

		ui.customRouterData({
			init: {
				price: String(ui.params.filter?.price.$lt),
			},

			load(data) {
				ui.updateParams((params) => {
					params.filter = {
						price: { $lt: Number(data.price) },
					};
				});
			},

			save() {
				return {
					price: String(ui.params.filter?.price.$lt),
				};
			},
		});

		ui.open("boots");
	});

	await expect.poll(async () => page.url()).toContain("fdk.c.price=999");

	await page.evaluate(async () => {
		ui.updateParams((params) => {
			params.filter.price = { $lt: 100 };
		});
	});

	await expect.poll(async () => page.url()).toContain("fdk.c.price=100");

	await page.evaluate(async () => {
		ui.updateParams((params) => {
			params.filter.price = { $lt: 999 };
		});
	});

	// Must restore the previous state
	await expect.poll(async () => page.url()).toContain("fdk.c.price=999");
});

test("can unbind customRouterData", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			fetchThrottle: 1,
		});

		const uiEvents: string[] = [];

		const unbind = ui.customRouterData({
			init: {
				price: "1",
			},

			load() {},

			save() {
				uiEvents.push("save");
				return {
					price: "",
				};
			},
		});

		Object.assign(window, { ui, uiEvents, unbind });

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const getEvents = async (): Promise<string[]> => {
		return await page.evaluate(async () => (window as any).uiEvents);
	};

	const initial = await getEvents();

	await page.evaluate(async () => {
		(window as any).unbind();
		ui.updateParams((params) => {
			params.filter.price = { $lt: 999 };
		});
	});

	expect(await getEvents()).toEqual(initial);

	await page.waitForTimeout(200);

	expect(await getEvents()).toEqual(initial);
});
