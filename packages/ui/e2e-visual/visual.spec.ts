import { test, expect } from "@playwright/test";

declare const MOD: typeof import("../src/cdn-entries/index");

test("input is visually correct", async ({ page }) => {
	await page.goto("/single-group");

	const input = page.locator('[aria-label="Search input"]');
	const button = page.locator("text=open");
	const hits = page.locator(".findkit--hit");

	await button.click();
	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	await expect(page.locator(".findkit--header")).toHaveScreenshot();
});

test("can show backdrop", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			css: MOD.css`
				.findkit--modal {
					position: fixed;
					width: initial;
					height: initial;
					inset: 20px;
				}
			`,
		});

		await ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("centers the content with width css", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			css: MOD.css`
				.findkit--modal {
                    inset: initial;
                    width: 400px;
                    margin: 10px;
				}
			`,
		});

		await ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("can set modal top", async ({ page }) => {
	await page.goto("/external-input-dummy");

	await page.evaluate(async () => {
		const { FindkitUI, css, html } = MOD;

		const ui = new FindkitUI({
			publicToken: "po8GK3G0r",
			slots: {
				Layout(props) {
					return html`${props.content}`;
				},
				Hit() {
					// Hide the actual results so content won't change the
					// screenshot
					return html`<h1>Hit</h1>`;
				},
			},
			css: css`
				.findkit--backdrop {
					top: 50px;
				}
			`,
		});
		void ui.bindInput(document.querySelector("#external-input")!);
	});

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();

	await page.waitForTimeout(200);

	await expect(page).toHaveScreenshot();
});

test("modal slides under the backdrop container", async ({ page }) => {
	await page.goto("/external-input-dummy");

	await page.evaluate(async () => {
		const { FindkitUI, css, html } = MOD;

		const ui = new FindkitUI({
			publicToken: "po8GK3G0r",
			slots: {
				Layout(props) {
					return html`${props.content}`;
				},
				Hit() {
					// Hide the actual results so content won't change the
					// screenshot
					return html`<h1>Hit</h1>`;
				},
			},
			css: css`
				.findkit--backdrop {
					top: 50px;
				}

				.findkit--modal-visible {
					transform: translateY(-50%);
				}
			`,
		});

		void ui.bindInput(document.querySelector("#external-input")!);
	});

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();

	await page.waitForTimeout(200);

	await expect(page).toHaveScreenshot();
});

test("can use load() with styles", async ({ page }) => {
	await page.goto("/manual-load");

	const input = page.locator('[aria-label="Search input"]');
	const button = page.locator("text=open");

	await button.click();
	await input.waitFor({ state: "visible" });

	await expect(page.locator(".findkit--header")).toHaveScreenshot();
});

test("can remove the close button", async ({ page }) => {
	await page.goto("/dummy");

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "po8GK3G0r",
			slots: {
				Header(props) {
					return html`
						No close button!
						<${props.Input} />
					`;
				},
			},
		});

		await ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("overlay modal", async ({ page }) => {
	await page.goto("/overlay-modal");
	const input = page.locator("#external-input");
	const hits = page.locator(".findkit-overlay-container .findkit--hit");
	await input.fill("valu");

	await expect(hits.first()).toBeVisible();
	await expect(page).toHaveScreenshot({
		mask: [hits],
	});
});
