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
					return html`${props.hit.title} ${props.hit.customFields.price?.value}`;
				},
			},
		});

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const prices = await hits.allInnerTexts();
	expect(prices).toEqual(["Suede Boots 100", "Rubber Boots 30"]);
});

test("can filter and sort (2)", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
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

test("can dynamically update filter using useParams hook", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html, useParams } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
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
				Header(props) {
					const [params, setParams] = useParams<{
						filter: {
							price?: { $lt: string };
						};
					}>();

					const max = params.filter?.price?.$lt ?? "";

					return html`
						${props.children}
						<span class="max-value">${max}</span>
						<input
							type="text"
							class="max"
							value="${max}"
							onChange=${(e: { target: { value: string } }) => {
								setParams((params) => {
									params.filter = { price: { $lt: e.target.value } };
								});
							}}
						/>
					`;
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

	const maxInput = page.locator(".max");
	await maxInput.fill("50");

	// Just ensure that params hook updates as expected
	await expect(page.locator(".max-value")).toHaveText("50");

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
	expect(page.url()).toContain("fdk_c_sort=price_desc");

	await page.getByLabel("Cheapest first").check();
	await expect.poll(getPrices).toEqual(["30", "100", "220"]);
	expect(await getFetches()).toEqual(["", "boots", "boots", "boots"]);
	expect(page.url()).toContain("fdk_c_sort=price_asc");

	// Can restore the form state and return the same results
	await page.reload();
	await expect(page.getByLabel("Cheapest first")).toBeChecked();
	await expect.poll(getPrices).toEqual(["30", "100", "220"]);

	expect(await getFetches()).toEqual(["boots"]);
});
