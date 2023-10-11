import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<
	typeof import("../src/cdn-entries/index").FindkitUI
>;

test("marks old search results as stale when typing fast", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			infiniteScroll: false,
		});

		const testEvents: any[] = [];
		Object.assign(window, { testEvents });

		ui.on("fetch-done", (e) => {
			testEvents.push(`fetch-done:${e.stale ? "stale" : "fresh"}`);
		});

		ui.open();

		Object.assign(window, { ui });
	});

	const input = page.locator("input");
	await input.pressSequentially("diamond", { delay: 100 });

	await page.waitForTimeout(1000);

	const testEvents = await page.evaluate(async () => {
		return (window as any).testEvents as any[];
	});

	// Response timing is not 100% deterministic, so we just check that the first
	// events are stale and the last one is fresh which should be always true.
	expect(testEvents[0]).toEqual("fetch-done:stale");
	expect(testEvents[1]).toEqual("fetch-done:stale");
	expect(testEvents.at(-1)).toEqual("fetch-done:fresh");
});

test("slow typer gets only fresh events", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 1,
			infiniteScroll: false,
			fetchThrottle: 10,
		});

		const testEvents: any[] = [];
		Object.assign(window, { testEvents });

		ui.on("fetch-done", (e) => {
			testEvents.push(`fetch-done:${e.stale ? "stale" : "fresh"}`);
		});

		ui.open();

		Object.assign(window, { ui });
	});

	const input = page.locator("input");
	await input.pressSequentially("ring", { delay: 1000 });

	await page.waitForTimeout(1000);

	const testEvents = await page.evaluate(async () => {
		return (window as any).testEvents as any[];
	});

	// Event amount can be random due to response delays but they all should be
	// fresh because the user is typing slower than the throttle time.
	expect(testEvents).toEqual(testEvents.map(() => "fetch-done:fresh"));
	expect(testEvents.length).toBeGreaterThan(3);
});

test("holding backspace does not emit partial non-stale fetch-done terms", async ({
	page,
}) => {
	await page.route(
		(url) => url.hostname === "search.findkit.com",
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (route) => {
			await new Promise((f) => setTimeout(f, 500));
			await route.continue();
		},
	);

	await page.goto(staticEntry("/dummy"));
	const terms = "diamond ring jewelry features";

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			infiniteScroll: false,
			minTerms: 1,
		});

		ui.open();

		Object.assign(window, { ui });
	});

	const input = page.locator("input");

	await input.fill(terms);

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await page.evaluate(async () => {
		const testEvents: any[] = [];
		ui.on("fetch-done", (e) => {
			Object.assign(window, { testEvents });
			testEvents.push(`fetch-done:${e.stale ? "stale" : "fresh"}`);
		});
	});

	let i = terms.length;
	while (i--) {
		await page.keyboard.press("Backspace");
		await page.waitForTimeout(30);
	}

	await page.waitForTimeout(1000);

	const testEvents = await page.evaluate(async () => {
		return (window as any).testEvents as any[];
	});

	// Event amount can be random due to response delays but they all should be
	// stale because because all characters are removed until empty. No
	// fresh search response at all because the last term is empty string
	expect(testEvents).toEqual(testEvents.map(() => "fetch-done:stale"));
	expect(testEvents.length).toBeGreaterThan(3);
});
