import { expect, test } from "@playwright/test";
import { spinnerLocator } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can set required terms length to zero", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });
});

test("can disable shadow dom", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		document.getElementById("custom-css")!.innerHTML = `
			input {
				background-color: rgb(255, 0, 0) !important;
			}
		`;

		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			shadowDom: false,
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });

	await expect(input).toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("shadown dom is enabled by default", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		document.getElementById("custom-css")!.innerHTML = `
			input {
				background-color: rgb(255, 0, 0) !important;
			}
		`;

		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });

	await expect(input).not.toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("custom inputs does not mess up the focus management", async ({
	page,
}) => {
	await page.goto("/dummy");

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

		await ui.open();
	});
	await expect(page.locator('[aria-label="Search input"]')).toBeFocused();
});

test("updates from history.pushState()", async ({ page }) => {
	await page.goto("/dummy");

	const hits = page.locator(".findkit--hit a");
	const loading = spinnerLocator(page);
	const input = page.locator('[aria-label="Search input"]');

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		await ui.open("valu");
	});

	await hits.first().waitFor({ state: "visible" });
	const result1 = await hits
		.first()
		.evaluate((e: HTMLElement) => e.getAttribute("href"));

	await page.keyboard.press("Tab");

	await page.evaluate(async () => {
		history.pushState(undefined, "", "?fdk_q=wordpress");
	});
	await loading.waitFor({ state: "hidden" });

	const result2 = await hits
		.first()
		.evaluate((e: any) => e.getAttribute("href"));

	await expect(input).toHaveValue("wordpress");

	expect(result1).not.toBe(result2);
});

test("can change terms after fetching all", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		await ui.open();
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
	await page.goto("/dummy");

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

test("can use memory routing", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			router: "memory",
			params: {
				tagQuery: [],
			},
		});

		await ui.open("valu");
	});

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');

	await hits.first().waitFor({ state: "visible" });
	await expect(page).not.toHaveURL(/fdk_q/);

	const firstResults = await hits.first().textContent();

	await input.fill("wordpress");

	await expect(hits.first()).not.toHaveText(firstResults!);
	await expect(page).not.toHaveURL(/fdk_q/);
});
