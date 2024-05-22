import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test("loaded prop is set true after preload", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	const loaded = await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "na",
		});
		(window as any).ui = ui;

		return ui.loaded;
	});

	expect(loaded).toEqual(false);

	const loaded2 = await page.evaluate(async () => {
		await ui.preload();
		return ui.loaded;
	});

	expect(loaded2).toEqual(true);
});

test("loaded prop is set true after loaded event", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	const loaded = await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "na",
		});
		(window as any).ui = ui;

		return ui.loaded;
	});

	expect(loaded).toEqual(false);

	const loaded2 = await page.evaluate(async () => {
		ui.open();
		await new Promise<void>((resolve) => {
			ui.on("loaded", () => {
				resolve();
			});
		});
		return ui.loaded;
	});

	expect(loaded2).toEqual(true);
});

test("loaded prop is set true after custom-router-data event", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	const loaded = await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "na",
		});
		(window as any).ui = ui;

		return ui.loaded;
	});

	expect(loaded).toEqual(false);

	const loaded2 = await page.evaluate(async () => {
		ui.open();
		await new Promise<void>((resolve) => {
			ui.on("custom-router-data", () => {
				resolve();
			});
		});
		return ui.loaded;
	});

	expect(loaded2).toEqual(true);
});
