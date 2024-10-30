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
			defaultCustomRouterData: {
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

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect.poll(async () => page.url()).toContain("fdk_c_price=999");

	await page.evaluate(async () => {
		ui.updateParams((params) => {
			params.filter.price = { $lt: 100 };
		});
	});

	await expect.poll(async () => page.url()).toContain("fdk_c_price=100");

	await page.reload();
	await page.waitForLoadState("domcontentloaded");

	await expect.poll(async () => page.url()).toContain("fdk_c_price=100");
});

test("can serialize data using custom prefix", async ({ page }) => {
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
			customRouterDataPrefix: "custom_",
			defaultCustomRouterData: {
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

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect.poll(async () => page.url()).toContain("custom_price=999");

	await page.evaluate(async () => {
		ui.updateParams((params) => {
			params.filter.price = { $lt: 100 };
		});
	});

	await expect.poll(async () => page.url()).toContain("custom_price=100");

	await page.reload();
	await page.waitForLoadState("domcontentloaded");

	await expect.poll(async () => page.url()).toContain("custom_price=100");
});

test("can clear custom prefixed data on close", async ({ page }) => {
	await page.goto(staticEntry("/dummy?secret=donttouchme"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			customRouterDataPrefix: "custom_",
		});
		ui.open("boots");
		Object.assign(window, { ui });
	});

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: "a" });
		ui.open("diamond");
	});

	await expect.poll(async () => page.url()).toContain("custom_ding=a");
	await page.evaluate(async () => {
		ui.close();
	});
	await expect.poll(async () => page.url()).not.toContain("custom_ding=a");
	await expect.poll(async () => page.url()).toContain("secret=donttouchme");
});

test("can change back to previous custom router data", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			defaultCustomRouterData: {
				ding: "a",
			},
		});
		Object.assign(window, { ui });

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: "b" });
		ui.open("diamond");
	});

	// data can be updated
	await expect.poll(async () => page.url()).toContain("fdk_c_ding=b");

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: "a" });
		ui.open("leather");
	});

	// Must restore the previous state
	await expect.poll(async () => page.url()).toContain("fdk_c_ding=a");
});

test("defaultCustomRouterData is emitted with custom-router-data on load", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			defaultCustomRouterData: {
				ding: "a",
			},
		});
		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("custom-router-data", (e) => {
			uiEvents.push(e.data);
		});

		ui.open();
	});

	const header = page.locator(".findkit--header");
	await header.first().waitFor({ state: "visible" });

	expect(await page.evaluate(async () => (window as any).uiEvents)).toEqual([
		{
			ding: "a",
		},
	]);
});

test("defaultCustomRouterData can be overridden with custom-router-data on load", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy?fdk_c_ding=b"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			defaultCustomRouterData: {
				ding: "a",
			},
		});
		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("custom-router-data", (e) => {
			uiEvents.push(e.data);
		});

		ui.open();
	});

	const header = page.locator(".findkit--header");
	await header.first().waitFor({ state: "visible" });

	expect(await page.evaluate(async () => (window as any).uiEvents)).toEqual([
		{
			ding: "b",
		},
	]);

	await expect.poll(async () => page.url()).not.toContain("fdk_c_ding=a");
});

test("can remove query string with undefined", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "pW1D0p0Dg" });
		ui.open("boots");
		Object.assign(window, { ui });
	});

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: "a" });
		ui.open("diamond");
	});

	await expect.poll(async () => page.url()).toContain("fdk_c_ding=a");

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: undefined });
		ui.open("leather");
	});

	// qs is removed
	await expect.poll(async () => page.url()).not.toContain("fdk_c_ding=a");
});

test("defaultCustomRouterData is not set automatically to url", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy?fdk_c_ding=b"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			defaultCustomRouterData: {
				ding: "a",
			},
		});
		Object.assign(window, { ui });

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	expect(page.url()).not.toContain("fdk_c_ding=a");
});

test("can remove query string by removing the key", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "pW1D0p0Dg" });
		ui.open("boots");
		Object.assign(window, { ui });
	});

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: "a" });
		ui.open("diamond");
	});

	await expect.poll(async () => page.url()).toContain("fdk_c_ding=a");

	await page.evaluate(async () => {
		ui.setCustomRouterData({});
		ui.open("leather");
	});

	// qs is removed
	await expect.poll(async () => page.url()).not.toContain("fdk_c_ding=a");
});

test("setCustomRouterData is flushed on searches", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "pW1D0p0Dg", fetchThrottle: 100 });

		Object.assign(window, { ui });

		ui.open();
	});

	const header = page.locator(".findkit--header");
	await header.first().waitFor({ state: "visible" });

	await page.evaluate(async () => {
		ui.setCustomRouterData({ ding: "a" });
	});

	await page.waitForTimeout(500);

	expect(page.url()).not.toContain("fdk_c_ding=a");

	await page.evaluate(async () => {
		ui.open("boots");
	});

	await expect.poll(async () => page.url()).toContain("fdk_c_ding=a");
});

test("can use setCustomRouterData in fetch event", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "pW1D0p0Dg", fetchThrottle: 100 });
		ui.on("fetch", () => {
			ui.setCustomRouterData({ ding: "a" });
		});

		Object.assign(window, { ui });

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	expect(page.url()).toContain("fdk_c_ding=a");
});

test("emits custom-router-data on history object replaceState", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "pW1D0p0Dg" });
		const uiEvents: any[] = [];

		ui.on("custom-router-data", (e) => {
			uiEvents.push(e.data);
		});

		Object.assign(window, { ui, uiEvents });

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await page.evaluate(async () => {
		history.replaceState({}, "", "?fdk_c_ding=dong&fdk_q=boots");
	});

	const events = await page.evaluate(async () => (window as any).uiEvents);

	expect(events).toEqual([{}, { ding: "dong" }]);
});

test("emits custom-router-data on history object pushState and back navigation", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "pW1D0p0Dg" });
		const uiEvents: any[] = [];

		ui.on("custom-router-data", (e) => {
			uiEvents.push(e.data);
		});

		Object.assign(window, { ui, uiEvents });

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await page.evaluate(async () => {
		history.pushState({}, "", "?fdk_c_ding=dong&fdk_q=boots");
		history.pushState({}, "", "?fdk_c_ding=dang&fdk_q=boots");
	});

	await page.goBack();

	const events = await page.evaluate(async () => (window as any).uiEvents);

	expect(events).toEqual([
		{},
		{ ding: "dong" },
		{ ding: "dang" },
		{ ding: "dong" },
	]);
});

test("can use useCustomRouterData() hook", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	async function init() {
		await page.evaluate(async () => {
			const { FindkitUI, html, useCustomRouterData } = MOD;

			const ui = new FindkitUI({
				publicToken: "pW1D0p0Dg",
				// Not used used because locally overridden with initial in useCustomRouterData()
				defaultCustomRouterData: { counter: "5" },
				slots: {
					Header(props) {
						const [data, setData] = useCustomRouterData({ counter: "1" });
						const _typeTests = () => {
							// @ts-expect-error
							setData({ bad: "" });

							// @ts-expect-error
							setData({ counter: 1 });

							setData((prev) => {
								prev.counter = "3";

								// @ts-expect-error
								prev.counter = 1;

								// @ts-expect-error
								prev.bad = "";
							});
						};

						const onClick = () => {
							setData({ counter: String(Number(data.counter) + 1) });
						};

						return html`
							${props.children}
							<button type="button" onClick=${onClick} class="inc">
								${data.counter}
							</button>
						`;
					},
				},
			});
			ui.open();

			Object.assign(window, { ui });
		});
	}

	await init();

	const header = page.locator(".findkit--header");
	await header.first().waitFor({ state: "visible" });
	const input = page.locator("input");

	const button = page.locator(".inc");
	await expect(button).toHaveText("1");
	await button.first().click();
	await expect(button).toHaveText("2");

	// wait for the throttle to pass
	await page.waitForTimeout(300);
	expect(page.url()).not.toContain("fdk_c_counter");

	await input.fill("boots");

	await expect.poll(() => page.url()).toContain("fdk_c_counter=2");

	await page.reload();
	await init();

	await expect(button).toHaveText("2");
});

test("useCustomRouterData() inits with default data", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	async function init() {
		await page.evaluate(async () => {
			const { FindkitUI, html, useCustomRouterData } = MOD;

			const ui = new FindkitUI({
				publicToken: "pW1D0p0Dg",
				defaultCustomRouterData: { counter: "5" },
				slots: {
					Header(props) {
						// No initial passed, so gets the defaultCustomRouterData
						const [data, setData] = useCustomRouterData();
						const onClick = () => {
							setData((data) => {
								data.counter = String(Number(data.counter) + 1);
							});
						};

						return html`
							${props.children}
							<button type="button" onClick=${onClick} class="inc">
								${data.counter}
							</button>
						`;
					},
				},
			});
			ui.open();

			Object.assign(window, { ui });
		});
	}

	await init();

	const header = page.locator(".findkit--header");
	await header.first().waitFor({ state: "visible" });
	const input = page.locator("input");

	const button = page.locator(".inc");
	await expect(button).toHaveText("5");
	await button.first().click();
	await expect(button).toHaveText("6");

	// wait for the throttle to pass
	await page.waitForTimeout(300);
	expect(page.url()).not.toContain("fdk_c_counter");

	await input.fill("boots");

	await expect.poll(() => page.url()).toContain("fdk_c_counter=6");

	await page.reload();
	await init();

	await expect(button).toHaveText("6");
});

test.describe("ui.customRouterData property", () => {
	test("default value can be read", async ({ page }) => {
		await page.goto(staticEntry("/dummy"));

		const defaultCRD = await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "na",
				defaultCustomRouterData: {
					price: "999",
				},
			});

			ui.open();

			await new Promise<void>((resolve) => {
				ui.on("custom-router-data", () => {
					resolve();
				});
			});

			return ui.customRouterData;
		});

		expect(defaultCRD).toEqual({ price: "999" });
	});

	test(".customRouterData can be updated before implementation load but read only after loading", async ({
		page,
	}) => {
		await page.goto(staticEntry("/dummy"));

		const crd = await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "na",
				defaultCustomRouterData: {
					price: "999",
				},
			});
			(window as any).ui = ui;

			ui.setCustomRouterData({
				price: "444",
			});

			await ui.preload();

			return ui.customRouterData;
		});

		expect(crd).toEqual({ price: "444" });
	});

	test(".customRouterData is updated from url after preload", async ({
		page,
	}) => {
		await page.goto(staticEntry("/dummy?fdk_c_price=33"));

		const crd = await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "na",
			});
			(window as any).ui = ui;

			await ui.preload();

			return ui.customRouterData;
		});

		expect(crd).toEqual({ price: "33" });
	});

	test(".customRouterData is updated after custom-router-data event", async ({
		page,
	}) => {
		await page.goto(staticEntry("/dummy?fdk_c_price=33"));

		const crd = await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "na",
			});
			(window as any).ui = ui;

			ui.open();

			let crd;

			await new Promise<void>((resolve) => {
				ui.on("custom-router-data", () => {
					resolve();
					crd = ui.customRouterData;
				});
			});

			return crd;
		});

		expect(crd).toEqual({ price: "33" });
	});

	test("after custom-route-data event the .customRouterData is updated immediately", async ({
		page,
	}) => {
		await page.goto(staticEntry("/dummy"));

		const crd = await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const ui = new FindkitUI({
				publicToken: "na",
			});
			(window as any).ui = ui;

			ui.open();

			await new Promise<void>((resolve) => {
				ui.on("custom-router-data", () => {
					resolve();
				});
			});

			ui.setCustomRouterData({
				price: "44",
			});

			return ui.customRouterData;
		});

		expect(crd).toEqual({ price: "44" });
	});
});
