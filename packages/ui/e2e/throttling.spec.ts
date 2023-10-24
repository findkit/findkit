import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<
	typeof import("../src/cdn-entries/index").FindkitUI
>;

test("search input is throttled", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			fetchThrottle: 500,
			minTerms: 0,
		});

		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("fetch", () => {
			uiEvents.push("fetch");
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const input = page.locator("input");
	await input.pressSequentially("test test", { delay: 50 });

	await page.waitForTimeout(1000);

	const fetchCount = await page.evaluate(async () => {
		return (window as any).uiEvents.length;
	});

	expect(fetchCount).toBeLessThan(5);
});

test("page load search is not throttled", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			fetchThrottle: 31_000,
		});

		await ui.preload();

		const started = Date.now();

		ui.on("fetch", () => {
			(window as any).fetchTime = Date.now() - started;
		});

		ui.open("boots");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const fetchTime = await page.evaluate(async () => {
		return (window as any).fetchTime;
	});

	expect(fetchTime).toBeLessThan(50);
});

test("search input is throttled for trailing invoke", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			fetchThrottle: 1000,
			minTerms: 1,
		});

		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("fetch", (e) => {
			uiEvents.push("fetch:" + e.terms);
		});

		ui.open();
	});

	const input = page.locator("input");
	await input.pressSequentially("leather boots", { delay: 20 });

	const hits = page.locator(".findkit--hit");
	await expect(hits.first()).toContainText("Leather Boots");

	const fetchEvent = await page.evaluate(async () => {
		return (window as any).uiEvents;
	});

	// Only traling fetch is done
	expect(fetchEvent).toEqual(["fetch:leather boots"]);
});

test("updateParams is throttled", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			fetchThrottle: 500,
			minTerms: 0,
			slots: {
				Header(props) {
					return html`
						${props.children}
						<input
							class="category"
							type="text"
							onChange=${(e: any) => {
								ui.updateParams((params) => {
									params.filter.category = e.target.value;
								});
							}}
						/>
					`;
				},
			},
		});

		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("fetch", () => {
			uiEvents.push("fetch");
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const input = page.locator("input.category");
	await input.pressSequentially("test test", { delay: 50 });

	await page.waitForTimeout(1000);

	const fetchCount = await page.evaluate(async () => {
		return (window as any).uiEvents.length;
	});

	// 1. intial fetch
	// 2. Leading invoke
	// 3. Throttled invoke
	expect(fetchCount).toBe(3);
});

test("updateParams is invoked immediately on first call (leading invoke)", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			fetchThrottle: 3000,
			minTerms: 0,
		});

		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("fetch", () => {
			uiEvents.push("fetch");
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await page.evaluate(async () => {
		ui.updateParams((params) => {
			params.filter.category = "change";
		});
	});

	await page.waitForTimeout(500);

	const fetchCount = await page.evaluate(async () => {
		return (window as any).uiEvents.length;
	});

	// 1. intial fetch
	// 2. Leading invoke (long fetchThrottle)
	expect(fetchCount).toBe(2);
});
