import { test, expect } from "@playwright/test";
import { staticEntry } from "../e2e/helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("input is visually correct", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));

	const input = page.locator('[aria-label="Search input"]');
	const button = page.locator("text=open");
	const hits = page.locator(".findkit--hit");

	await button.click();
	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	await expect(page.locator(".findkit--header")).toHaveScreenshot();
});

test("can show backdrop", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

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

		ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("centers the content with width css", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

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

		ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("can set modal top", async ({ page }) => {
	await page.goto(staticEntry("/external-input-dummy"));

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
		void ui.bindInput("#external-input"!);
	});

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();

	await page.waitForTimeout(200);

	await expect(page).toHaveScreenshot();
});

test("modal slides under the backdrop container", async ({ page }) => {
	await page.goto(staticEntry("/external-input-dummy"));

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

		void ui.bindInput("#external-input"!);
	});

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();

	await page.waitForTimeout(200);

	await expect(page).toHaveScreenshot();
});

test("can use load() with styles", async ({ page }) => {
	await page.goto(staticEntry("/manual-load"));

	const input = page.locator('[aria-label="Search input"]');
	const button = page.locator("text=open");

	await button.click();
	await input.waitFor({ state: "visible" });

	await expect(page.locator(".findkit--header")).toHaveScreenshot();
});

test("can remove the close button", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

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

		ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("overlay modal", async ({ page }) => {
	await page.goto(staticEntry("/overlay-modal"));
	const input = page.locator("#external-input");
	const hits = page.locator(".findkit-overlay-container .findkit--hit");
	await input.fill("valu");

	await expect(hits.first()).toBeVisible();

	const hasShadow = await page.evaluate(() => {
		return !!document.querySelector(".findkit-overlay-container")?.shadowRoot;
	});

	expect(hasShadow).toBe(true);

	await expect(page).toHaveScreenshot({
		mask: [hits],
	});
});

test("overlay modal without shadow dom", async ({ page }) => {
	await page.goto(staticEntry("/overlay-modal?no-shadow"));
	const input = page.locator("#external-input");
	const hits = page.locator(".findkit-overlay-container .findkit--hit");
	await input.fill("valu");

	await expect(hits.first()).toBeVisible();

	const hasShadow = await page.evaluate(() => {
		return !!document.querySelector(".findkit-overlay-container")?.shadowRoot;
	});

	expect(hasShadow).toBe(false);

	await expect(page).toHaveScreenshot({
		mask: [hits],
	});
});

test("ResizeObserver offset", async ({ page }) => {
	await page.goto(staticEntry("/resize-observer"));
	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit");

	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	await expect(page).toHaveScreenshot({
		mask: [hits],
	});

	await page.setViewportSize({ width: 600, height: 600 });

	await page.waitForTimeout(500);

	await expect(page).toHaveScreenshot({
		mask: [hits],
	});
});

test("header is shown when scrolled up a bit", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));
	await page.setViewportSize({ width: 600, height: 600 });

	const input = page.locator('[aria-label="Search input"]');
	const hits = page.locator(".findkit--hit");
	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			slots: {
				Hit() {
					return MOD.html`<h1>Hit</h1>`;
				},
			},
		});

		ui.open();
	});

	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	await page.mouse.wheel(0, 500);

	await page.waitForTimeout(500);

	await expect(page).toHaveScreenshot();

	await page.mouse.wheel(0, -100);
	await page.waitForTimeout(500);

	await expect(page).toHaveScreenshot();
});

test("can render custom fields", async ({ page }) => {
	await page.goto(staticEntry("/custom-fields"));

	const button = page.locator("text=open");
	const input = page.locator('[aria-label="Search input"]');
	const hits = page.locator(".findkit--hit");
	const img = page.locator(".findkit--hit img");
	const titles = page.locator(".findkit--hit h2");

	await button.click();
	await input.type("mikko");

	await hits.first().waitFor({ state: "visible" });

	await expect(page).toHaveScreenshot({
		mask: [img, titles],
	});
});

test("group header and footer margins", async ({ page }) => {
	await page.goto(staticEntry("two-groups"));
	const hits = page.locator(".findkit--hit");

	const button = page.locator("button", { hasText: "open" });

	const input = page.locator('[aria-label="Search input"]');

	await button.click();
	await input.fill("noresultswiththisstring");

	await page
		.locator(".findkit--group-all-results-shown")
		.first()
		.waitFor({ state: "visible" });

	await expect(page).toHaveScreenshot({
		mask: [hits, input],
	});

	await input.fill("valu");

	await hits.first().waitFor({ state: "visible" });
	await page.mouse.wheel(0, 500);

	// show more link
	await expect(page).toHaveScreenshot({
		mask: [hits, input],
	});

	await page.locator("text=Show more search results").first().click();
	await page.locator("text=Back").first().waitFor({ state: "visible" });

	// Show back link
	await expect(page).toHaveScreenshot({
		mask: [hits, input],
	});
});
