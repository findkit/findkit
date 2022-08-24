import { expect, test } from "@playwright/test";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can set required terms lenght to zero", async ({ page }) => {
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
	const loading = page.locator(".findkit--logo-animating");
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
