import { test, expect, Page } from "@playwright/test";
import { gotoWithEarlyHook } from "../e2e/helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

// Workaround for playwright not supporting <dialog> with .showModal()
// https://github.com/microsoft/playwright/issues/29878
async function gotoWithoutTrap(page: Page, path: string) {
	await gotoWithEarlyHook(page, path, async () => {
		await page.evaluate(async () => {
			window.addEventListener("findkituievent", (e) => {
				if (e.detail.eventName !== "init") {
					return;
				}

				e.detail.data.options.inert = false;
			});
		});
	});
}

test("input is visually correct", async ({ page }) => {
	await gotoWithoutTrap(page, "/single-group");

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
	await gotoWithoutTrap(page, "/custom-html-font-size");

	const input = page.locator('[aria-label="Search input"]');
	const button = page.locator("text=open");
	const hits = page.locator(".findkit--hit");

	await button.click();
	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	await expect(page.locator(".findkit--header")).toHaveScreenshot();
});

test("can show backdrop", async ({ page }) => {
	await gotoWithoutTrap(page, "/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			backdrop: true,
		});

		ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("content is correctly sized when top is added to .findkit--modal-container", async ({
	page,
}) => {
	await page.setViewportSize({ width: 500, height: 600 });

	await gotoWithoutTrap(page, "/dummy");

	await page.evaluate(async () => {
		const { FindkitUI, css, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			css: css`
				.findkit--modal {
					border: 20px dotted cyan;
				}

				.pilar {
					height: 1000px;
					width: 200px;
					border: 5px solid violet;
					display: flex;
					align-items: flex-end;
				}

				.findkit--modal-container {
					border: 1px solid red;
					top: 50px;
				}
			`,
			slots: {
				Content(props) {
					return html`
						${props.children}
						<div class="pilar">content bottom</div>
					`;
				},
			},
		});

		ui.open();
	});

	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();

	await page.locator(".findkit--content").click();
	await page.mouse.wheel(0, 1000);
	await page.waitForTimeout(500);
	await expect(page).toHaveScreenshot();
});

test("content is correctly sized when top is added to .findkit--modal-container with backdrop", async ({
	page,
}) => {
	await gotoWithoutTrap(page, "/dummy");

	await page.evaluate(async () => {
		const { FindkitUI, css, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			backdrop: true,
			css: css`
				.findkit--modal {
					border: 20px dotted cyan;
				}

				.pilar {
					height: 1000px;
					width: 200px;
					border: 5px solid violet;
					display: flex;
					align-items: flex-end;
				}

				.findkit--modal-container {
					border: 1px solid red;
					top: 50px;
				}
			`,
			slots: {
				Content(props) {
					return html`
						${props.children}
						<div class="pilar">content bottom</div>
					`;
				},
			},
		});

		ui.open();
	});

	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();

	await page.locator(".findkit--content").click();
	await page.mouse.wheel(0, 1000);
	await page.waitForTimeout(500);
	await expect(page).toHaveScreenshot();
});

test("no backdrop on small screens", async ({ page }) => {
	await page.setViewportSize({ width: 400, height: 600 });
	await gotoWithoutTrap(page, "/dummy");

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			backdrop: true,
		});

		ui.open();
	});
	await page.locator("input").waitFor({ state: "visible" });
	await expect(page).toHaveScreenshot();
});

test("centers the content with width css", async ({ page }) => {
	await gotoWithoutTrap(page, "/dummy");

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
	await gotoWithoutTrap(page, "/external-input-dummy");

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
	await gotoWithoutTrap(page, "/external-input-dummy");

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
	await gotoWithoutTrap(page, "/manual-load");

	const input = page.locator('[aria-label="Search input"]');
	const button = page.locator("text=open");

	await button.click();
	await input.waitFor({ state: "visible" });

	await expect(page.locator(".findkit--header")).toHaveScreenshot();
});

test("can remove the close button", async ({ page }) => {
	await gotoWithoutTrap(page, "/dummy");

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "po8GK3G0r",
			slots: {
				Header(props) {
					return html`
						No close button!
						<${props.parts.Input} />
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
	await gotoWithoutTrap(page, "/overlay-modal");

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
	await gotoWithoutTrap(page, "/overlay-modal?no-shadow");
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
	await gotoWithoutTrap(page, "/resize-observer");
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
	await gotoWithoutTrap(page, "/dummy");
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
	await gotoWithoutTrap(page, "/custom-fields");

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
	await gotoWithoutTrap(page, "two-groups");
	const hits = page.locator(".findkit--hit");

	const button = page.locator("button", { hasText: "open" });

	const input = page.locator('[aria-label="Search input"]');

	await button.click();
	await input.fill("noresultswiththisstring");

	await page
		.locator(".findkit--group-all-results-shown")
		.first()
		.waitFor({ state: "visible" });

	await expect.soft(page).toHaveScreenshot({
		mask: [hits, input],
	});

	await input.fill("valu");

	await hits.first().waitFor({ state: "visible" });
	await page.mouse.wheel(0, 500);

	// show more link
	await expect.soft(page).toHaveScreenshot({
		mask: [hits, input],
	});

	await page.locator("text=Show more search results").first().click();

	const backLink = page.locator("text=Back").first();

	await backLink.waitFor({ state: "visible" });
	await backLink.scrollIntoViewIfNeeded();

	// Show back link
	await expect(page).toHaveScreenshot({
		mask: [hits, input],
	});
});

test("can horizonally position groups", async ({ page }) => {
	await gotoWithoutTrap(page, "horizontal-groups");

	const input = page.locator('[aria-label="Search input"]');
	const hits = page.locator(".findkit--hit");
	const backLink = page.locator("text=Back");
	const allLink = page.locator("text=Show more search results");

	await input.fill("wordpress");
	await hits.first().waitFor({ state: "visible" });

	await expect(page).toHaveScreenshot({ mask: [hits] });

	await allLink.first().click();

	await expect(backLink).toBeVisible();

	// wait for the scroll animation to pass
	await page.waitForTimeout(500);

	await page.mouse.wheel(0, -1000);

	await expect(page).toHaveScreenshot({ mask: [hits] });
});

test("superword matches are marked with class name and an icon", async ({
	page,
}) => {
	await gotoWithoutTrap(page, "superwords-match");

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
	await gotoWithoutTrap(page, "/dummy");

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

	await expect(page).toHaveScreenshot({
		mask: [page.locator(".findkit--error-props")],
	});
});

test("can restore findkit icon branding", async ({ page }) => {
	await gotoWithoutTrap(page, "/dummy");

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
	await gotoWithoutTrap(page, "/dummy");

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
	await gotoWithoutTrap(page, "/dummy");

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
	await gotoWithoutTrap(page, "/dummy");

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

	await gotoWithoutTrap(page, "/dummy");

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

test("built-in css is in a CSS Layer", async ({ page }) => {
	await gotoWithoutTrap(page, "/dummy");

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const style = document.createElement("style");
		document.head.appendChild(style);

		// Low specificity selector. The FindkitUI core CSS has more specific
		// selector for the border but this still overrides it because it's not
		// in a CSS Layer which has always higher specificity.
		style.innerHTML = `input { border: 5px solid red; }`;

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			shadowDom: false,
			// True is the default
			// cssLayers: true,
		});

		ui.open();
	});

	const header = page.locator(".findkit--header");
	await header.waitFor({ state: "visible" });

	await expect(header).toHaveScreenshot();
});

test("can disable CSS Layers", async ({ page }) => {
	await gotoWithoutTrap(page, "/dummy");

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;

		const style = document.createElement("style");
		document.head.appendChild(style);

		// Low specificity selector. The FindkitUI core CSS has more specific
		// selector so this has no effect
		style.innerHTML = `input { border: 5px solid red; }`;

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			cssLayers: false,
			shadowDom: false,
		});

		ui.open();
	});

	const header = page.locator(".findkit--header");
	await header.waitFor({ state: "visible" });

	await expect(header).toHaveScreenshot();
});

test("slots part props", async ({ page }) => {
	await gotoWithoutTrap(page, "/dummy");

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 0,
			groups: [
				{
					id: "group1",
					title: "Group 1",
					previewSize: 2,
				},
				{
					id: "group2",
					title: "Group 2",
					previewSize: 2,
				},
			],

			slots: {
				Header(props) {
					// prettier-ignore
					return html`
						<${props.parts.CloseButton}>Custom Close</${props.parts.CloseButton}>
						<${props.parts.Input} placeholder="Custom place holder" icon=${html`<b>FDK</b>`} />
					`
				},
				Hit(props) {
					// prettier-ignore
					return html`
						<${props.parts.TitleLink}><i>Custom hit title</i></${props.parts.TitleLink}>
						<${props.parts.Highlight} highlight="Custom <em>highlight</em>" />
						<${props.parts.URLLink}><i>Custom URL link</i></${props.parts.TitleLink}>
					`;
				},
				Group(props) {
					// prettier-ignore
					return html`
						<${props.parts.Title}><h2>Title Children</h2></${props.parts.Title}>
						<${props.parts.Hits} />
						<${props.parts.ShowAllLink}
							noResults="Custom no results"
							allResultsShown="Custom all results">
							Custom Show All
						</${props.parts.ShowAllLink}>
					`;
				},

				Results(props) {
					// prettier-ignore
					return html`
						<${props.parts.Title}><h2>Custom Results Title</h2></${props.parts.Title}>
						<${props.parts.BackLink}>
							Custom Back Link
						</${props.parts.BackLink}>
						<${props.parts.Hits} />
						<${props.parts.Footer} />
					`;
				},
			},
		});

		ui.open();
	});

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });
	await expect(page.locator(".findkit--container")).toHaveScreenshot();

	await page.locator("input").fill("leather boots");
	await page.waitForTimeout(300);
	await page.waitForLoadState("networkidle");
	await expect(page.locator(".findkit--container")).toHaveScreenshot();

	await page.locator("input").fill("nothing not found");
	await page.waitForTimeout(300);
	await page.waitForLoadState("networkidle");
	await expect(page.locator(".findkit--container")).toHaveScreenshot();

	// Something with multiple results so we can navigate to a group
	await page.locator("input").fill("and");
	await page.waitForTimeout(300);
	await page.waitForLoadState("networkidle");
	await page.locator("text=Custom Show All").first().click();
	await page.locator(".findkit--view-single").waitFor({ state: "visible" });

	// wait for scroll animation
	await page.waitForTimeout(500);
	await page.mouse.wheel(0, -1000);

	await expect(page.locator(".findkit--container")).toHaveScreenshot();
});
