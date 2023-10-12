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

test("input is visually correct with custom font-size on <html>", async ({
	page,
}) => {
	await page.goto(staticEntry("/custom-html-font-size"));

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
	await page.waitForLoadState("networkidle");

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

test("can horizonally position groups", async ({ page }) => {
	await page.goto(staticEntry("horizontal-groups"));

	const input = page.locator('[aria-label="Search input"]');
	const hits = page.locator(".findkit--hit");
	const backLink = page.locator("text=Back");
	const allLink = page.locator("text=Show more search results");

	await input.fill("wordpress");
	await hits.first().waitFor({ state: "visible" });

	await expect(page).toHaveScreenshot({ mask: [hits] });

	await allLink.first().click();

	await expect(backLink).toBeVisible();

	await page.mouse.wheel(0, -1000);

	await expect(page).toHaveScreenshot({ mask: [hits] });
});

test("superword matches are marked with class name and an icon", async ({
	page,
}) => {
	await page.goto(staticEntry("superwords-match"));

	const input = page.locator('[aria-label="Search input"]');
	const hits = page.locator(".findkit--hit");

	await input.fill("wordpress");
	await hits.first().waitFor({ state: "visible" });

	await expect(hits.first()).toHaveClass(/findkit--superwords-match/);
	await expect(hits.first().locator("svg")).toHaveCount(1);

	await expect(hits.nth(2)).not.toHaveClass(/findkit--superwords-match/);
	await expect(hits.nth(2).locator("svg")).toHaveCount(0);

	await expect(hits.first()).toHaveScreenshot();
});

test("hit error boundary", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			slots: {
				Hit(props) {
					if (props.hit.title.includes("Console")) {
						throw new Error("Test error");
					}

					return props.children;
				},
			},
		});

		ui.open("gaming");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect(page).toHaveScreenshot();
});

test("custom search input icon", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { html, FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			slots: {
				SearchInputIcon() {
					return html`<div style=${{ fontSize: "small" }}>Search</div>`;
				},
			},
		});

		ui.open("");
	});

	const header = page.locator(".findkit--header");
	await header.first().waitFor({ state: "visible" });

	await expect(header).toHaveScreenshot();
});

test("can restore findkit icon branding", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			css: `
				.findkit--magnifying-glass-lightning {
					visibility: visible;
				}
			`,
		});

		ui.open("");
	});

	const header = page.locator(".findkit--header");
	await header.first().waitFor({ state: "visible" });

	await expect(header).toHaveScreenshot();
});

test("form controls (button, input) inherit parent font-family in modal", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const css = `
			body {
				font-family: "Comic Sans MS", "Comic Sans", cursive;
			}
		`;

		const style = document.createElement("style");
		style.innerHTML = css;
		document.head.appendChild(style);

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			params: {
				size: 1,
			},
			infiniteScroll: false,
			slots: {
				Header(props) {
					return html`
						<input type="text" value="test" />
						<button>test</button>
						<textarea>test</textarea>
						<select>
							<option>test</option>
						</select>

						${props.children}
					`;
				},
			},
		});

		ui.open("gaming");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect(page).toHaveScreenshot({
		mask: [hits],
	});
});

test("form controls (button, input) inherit parent font-family in a custom container", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const css = `
			body {
				font-family: "Comic Sans MS", "Comic Sans", cursive;
			}
			#findkit-container {
				display: flex;
				background: white;
				height: 100vh;
			}
		`;

		const style = document.createElement("style");
		style.innerHTML = css;
		document.head.appendChild(style);

		const container = document.createElement("div");
		container.id = "findkit-container";
		document.body.appendChild(container);

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			container,
			params: {
				size: 1,
			},
			infiniteScroll: false,
			modal: false,
			slots: {
				Header(props) {
					return html`
						<input type="text" value="test" />
						<button>test</button>
						<textarea>test</textarea>
						<select>
							<option>test</option>
						</select>

						${props.children}
					`;
				},
			},
		});

		ui.open("gaming");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect(page).toHaveScreenshot({
		mask: [hits],
	});
});

test("hover background is defived from --brand-color", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			infiniteScroll: false,
			css: `
				.findkit--container {
					--findkit--brand-color: olive;
				}
			`,
			fetchCount: 1,
			groups: [
				{
					title: "Group 1",
					id: "group1",
					previewSize: 1,
					params: { size: 1 },
				},
				{
					title: "Group 2",
					id: "group2",
					params: { size: 1 },
				},
			],
		});

		ui.open("styl");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const showMoreButton = page.locator("text=Show more");
	await showMoreButton.first().hover();
	await page.waitForTimeout(400);
	await expect(showMoreButton.first()).toHaveScreenshot();

	await showMoreButton.first().click();

	const backButton = page.locator("text=Back");
	await backButton.first().hover();
	await page.waitForTimeout(400);
	await expect(backButton).toHaveScreenshot();

	const loadMore = page.locator("text=Load more");
	await loadMore.first().hover();
	await page.waitForTimeout(400);
	await expect(loadMore).toHaveScreenshot();
});

test("no side scroll", async ({ page }) => {
	await page.setViewportSize({ width: 300, height: 600 });

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const ui = new FindkitUI({ publicToken: "pW1D0p0Dg" });

		ui.open("diamond");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await page.mouse.wheel(0, 200);

	await expect(page).toHaveScreenshot();
});
