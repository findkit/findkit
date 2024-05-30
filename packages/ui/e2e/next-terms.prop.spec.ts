import { expect, test } from "@playwright/test";
import { mockSearchResponses, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test("ui.nextTerms are readable after `load` and `customer-router-data` events", async ({
	page,
}) => {
	await mockSearchResponses(page);
	await page.goto(staticEntry("/dummy?fdk_q=test"));

	const terms = await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "na",
		});

		let terms = "";

		ui.on("custom-router-data", () => {
			terms += ui.nextTerms;
		});

		ui.on("loaded", () => {
			terms += ui.nextTerms;
		});

		await ui.preload();

		return terms;
	});

	// from both `load` and `customer-router-data` events
	expect(terms).toEqual("testtest");
});

test("ui.nextTerms is updated immediately after calling .search()", async ({
	page,
}) => {
	await mockSearchResponses(page);
	await page.goto(staticEntry("/dummy?fdk_q=initial"));

	const terms = await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "na" });
		(window as any).ui = ui;

		const nextTerms: string[] = [];
		const usedTerms: string[] = [];

		await ui.preload();
		nextTerms.push(ui.nextTerms);
		usedTerms.push(ui.usedTerms);

		ui.search("first");
		nextTerms.push(ui.nextTerms);
		usedTerms.push(ui.usedTerms);

		ui.search("second");

		nextTerms.push(ui.nextTerms);
		usedTerms.push(ui.usedTerms);

		return { nextTerms, usedTerms };
	});

	expect(terms.nextTerms).toEqual(["initial", "first", "second"]);
	expect(terms.usedTerms).toEqual(["", "", ""]);

	await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

	const usedTerms = await page.evaluate(async () => {
		return ui.usedTerms;
	});

	expect(usedTerms).toEqual("second");
});

test("ui.nextTerms is updated immediately on input change", async ({
	page,
}) => {
	await mockSearchResponses(page);
	await page.goto(staticEntry("/dummy?fdk_q=initial"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({ publicToken: "na", fetchThrottle: 500 });
		(window as any).ui = ui;
		ui.open();
	});

	const input = page.locator(".findkit--header input");
	await input.waitFor({ state: "visible" });

	await input.fill("first");
	await input.fill("second");

	const nextTerms = await page.evaluate(async () => {
		return ui.nextTerms;
	});

	expect(nextTerms).toEqual("second");
});
