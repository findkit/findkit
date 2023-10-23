import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test("can serialize data from params event to customRouteData", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI<{
			params: {
				filter: {
					price: {
						$lt: number;
					};
				};
			};
			customRouterData: {
				price: string;
			};
		}>({
			publicToken: "pW1D0p0Dg",
			initialCustomRouterData: {
				price: "999",
			},
			params: {
				filter: {
					price: { $lt: 999 },
				},
			},
		});

		Object.assign(window, { ui });

		ui.on("params", () => {
			ui.setCustomRouterData({
				price: String(ui.params.filter?.price.$lt),
			});
		});

		ui.on("custom-router-data", (e) => {
			ui.updateParams((params) => {
				params.filter = {
					price: { $lt: Number(e.data.price) },
				};
			});
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
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			initialCustomRouterData: {
				ding: "a",
			},
		});
		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("fetch", () => {
			uiEvents.push("fetch");
		});

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	expect(await page.evaluate(async () => (window as any).uiEvents)).toEqual([
		"fetch",
	]);

	// initial router data is set to url
	await expect.poll(async () => page.url()).toContain("fdk.c.ding=a");

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: "b" });
	});

	// data can be updated
	await expect.poll(async () => page.url()).toContain("fdk.c.ding=b");

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: "a" });
	});

	// Must restore the previous state
	await expect.poll(async () => page.url()).toContain("fdk.c.ding=a");

	// Custom route data does not cause fetchesj
	expect(await page.evaluate(async () => (window as any).uiEvents)).toEqual([
		"fetch",
	]);
});
