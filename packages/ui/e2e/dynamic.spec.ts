import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<(typeof MOD)["FindkitUI"]>;

test("can set required terms length to zero", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			params: {
				tagQuery: [],
			},
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });
});

test("custom inputs does not mess up the focus management", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
			slots: {
				Header: (props) => {
					return MOD.html`<input name="extra-input" />${props.children}`;
				},
			},
		});

		ui.open();
	});
	await expect(page.locator('[aria-label="Search input"]')).toBeFocused();
});

test("can change terms after fetching all", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		ui.open();
		Object.assign(window, { ui });
	});

	const hits = page.locator(".findkit--hit");
	const input = page.locator('[aria-label="Search input"]');

	// Something that has only page of results eg. triggers "all hits fetched"
	await input.fill("headup javascript");

	await hits.first().waitFor({ state: "visible" });
	const initialContent = await hits.first().textContent();

	expect(await hits.count()).toBeLessThan(5);
	expect(await hits.count()).toBeGreaterThan(1);

	await input.fill("valu");

	// Expect results to change
	await expect(hits.first()).not.toHaveText(initialContent!);
});

test("can bind .open(terms) to a button", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		document.querySelector("#open-button")!.addEventListener("click", () => {
			void ui.open("valu");
		});

		Object.assign(window, { ui });
	});

	const button = page.locator("text=open");
	const input = page.locator('[aria-label="Search input"]');
	const hits = page.locator(".findkit--hit");

	await button.click();
	await hits.first().waitFor({ state: "visible" });

	await expect(input).toHaveValue("valu");
	await expect(page).toHaveURL(/fdk_q=valu/);

	await page.keyboard.press("Escape");

	await expect(page).not.toHaveURL(/fdk_q=valu/);
	await expect(input).not.toBeVisible();

	await button.click();
	await hits.first().waitFor({ state: "visible" });

	await expect(input).toHaveValue("valu");
	await expect(page).toHaveURL(/fdk_q=valu/);
});

test("can customize fetch count", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			fetchCount: 3,
			infiniteScroll: false,
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	const loadMore = page.locator("text=Load more");

	await expect(hits).toHaveCount(3);
	await loadMore.click();
	await expect(hits).toHaveCount(6);
});

test("no fetches are made before the modal is opened", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 0,
		});

		const uiEvents: any[] = [];
		Object.assign(window, { ui, uiEvents });

		ui.on("fetch", () => {
			uiEvents.push("fetch");
		});

		await ui.preload();
	});

	await page.waitForTimeout(500);

	expect(
		await page.evaluate(async () => {
			return (window as any).uiEvents as any[];
		}),
	).toEqual([]);

	await page.evaluate(async () => {
		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	expect(
		await page.evaluate(async () => {
			return (window as any).uiEvents as any[];
		}),
	).toEqual(["fetch"]);
});
