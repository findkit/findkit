import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<(typeof MOD)["FindkitUI"]>;

test("fetch-done event", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			infiniteScroll: false,
			minTerms: 1,
			fetchCount: 1,
			groups: [
				{
					title: "Group 1",
					id: "1",
					params: {},
					previewSize: 1,
				},
				{
					title: "Group 1",
					id: "1",
					params: {},
					previewSize: 1,
				},
			],
		});

		const testEvents: any[] = [];
		Object.assign(window, { testEvents });

		ui.on("fetch-done", (e) => {
			console.log("fetch-done", e);
			testEvents.push({
				terms: e.terms,
				append: e.append,
			});
		});

		ui.open();
		Object.assign(window, { ui });
	});

	const waitForFetchDone = async (fn: () => Promise<any>) => {
		await page.evaluate(async () => {
			(window as any).promise = new Promise((resolve) => {
				ui.once("fetch-done", resolve);
			});
		});

		await fn();

		await page.evaluate(
			async () => {
				return (window as any).promise;
			},
			{ timeout: 5_000 },
		);
	};

	await waitForFetchDone(async () => {
		const input = page.locator("input");
		await input.fill("d");
	});

	await waitForFetchDone(async () => {
		const showMore = page.locator("text=Show more");
		await showMore.first().click();
	});

	await waitForFetchDone(async () => {
		const loadMore = page.locator("text=Load more");
		await loadMore.first().click();
	});

	await waitForFetchDone(async () => {
		const input = page.locator("input");
		await input.fill("diamond");
	});

	const testEvents = await page.evaluate(async () => {
		return (window as any).testEvents as any[];
	});

	expect(testEvents).toEqual([
		// Intial search
		{
			append: false,
			terms: "d",
		},
		// Group selected
		{
			append: true,
			terms: "d",
		},
		// Load more click
		{
			append: true,
			terms: "d",
		},
		// New search terms
		{
			append: false,
			terms: "diamond",
		},
	]);
});

test("can use bind-input event", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		document.body.innerHTML = `
			<input type="text" />
			<div id="container"></div>
		`;

		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			header: false,
			container: "#container",
		});

		const testEvents: any[] = [];
		Object.assign(window, { testEvents, ui });

		ui.on("bind-input", (e1) => {
			const listener = () => {
				testEvents.push("input:" + e1.input.value);
			};

			e1.input.addEventListener("input", listener);
			ui.on("unbind-input", (e2) => {
				if (e1.input === e2.input) {
					e1.input.removeEventListener("input", listener);
				}
			});
		});

		ui.bindInput("input");

		await ui.preload();
	});

	const input = page.locator("input");
	await input.fill("test1");

	await page.evaluate(async () => {
		ui.dispose();
	});

	await input.fill("test2");

	const testEvents = await page.evaluate(async () => {
		return (window as any).testEvents as any[];
	});

	expect(testEvents).toEqual(["input:test1"]);
});

test("bind-input is fired for the build-in input", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
		});

		const testEvents: any[] = [];
		Object.assign(window, { testEvents, ui });

		ui.on("bind-input", (e1) => {
			const listener = () => {
				testEvents.push("input:" + e1.input.value);
			};
			e1.input.addEventListener("input", listener);
		});

		const promise = new Promise((resolve) => {
			ui.once("loaded", resolve);
		});

		ui.open();

		await promise;
	});

	const input = page.locator("input");
	await input.fill("test");

	const testEvents = await page.evaluate(async () => {
		return (window as any).testEvents as any[];
	});

	expect(testEvents).toEqual(["input:test"]);
});