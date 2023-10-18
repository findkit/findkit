import { expect, test } from "@playwright/test";
import { spinnerLocator, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<
	typeof import("../src/cdn-entries/index").FindkitUI
>;

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

test("can disable shadow dom", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

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

		ui.open();
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });

	await expect(input).toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("shadown dom is enabled by default", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

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

		ui.open();
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });

	await expect(input).not.toHaveCSS("background-color", "rgb(255, 0, 0)");
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

test("updates from history.pushState()", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

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

		ui.open("valu");
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

test("can use memory routing", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			router: "memory",
			params: {
				tagQuery: [],
			},
		});

		ui.open("valu");
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

test("can open modal from link", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		document.querySelector("button")?.remove();

		const a = document.createElement("a");
		a.href = "bad";
		a.className = "link-open";
		a.innerText = "Link";
		document.body.appendChild(a);

		ui.openFrom(".link-open");

		Object.assign(window, { ui });
	});

	const link = page.locator("text=Link");
	await link.click();

	const input = page.locator('[aria-label="Search input"]');
	await input.fill("valu");
	await expect(page.locator(".findkit--hit").first()).toBeVisible();

	await expect(page).not.toHaveURL(/bad/);
});

test("can cmd links", async ({ page, context }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				tagQuery: [],
			},
		});

		document.querySelector("button")?.remove();

		const a = document.createElement("a");
		a.href = "new-page";
		a.className = "link-open";
		a.innerText = "Link";
		document.body.appendChild(a);

		ui.openFrom(".link-open");

		Object.assign(window, { ui });
	});

	const link = page.locator("text=Link");

	if (process.platform === "darwin") {
		await link.click({ modifiers: ["Meta"] });
	} else {
		await link.click({ modifiers: ["Control"] });
	}

	await expect.poll(() => context.pages()).toHaveLength(2);
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

test("can customize params.size", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			infiniteScroll: false,
			params: {
				size: 3,
			},
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	const loadMore = page.locator("text=Load more");

	await expect(hits).toHaveCount(3);
	await loadMore.click();
	await expect(hits).toHaveCount(6);
});

test("can use preact import", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, preact, html } = MOD;

		const { useState } = preact;

		function Counter() {
			const [count, setCount] = useState(0);

			return html`<button class="counter" onClick=${() => setCount(count + 1)}>
				${count}
			</button>`;
		}

		const ui = new FindkitUI({
			publicToken: "po8GK3G0r",
			slots: {
				Header(props) {
					return html`
						${props.children}
						<${Counter} />
					`;
				},
			},
		});

		ui.open();
	});

	const counter = page.locator(".counter");
	await expect(counter.first()).toBeVisible();

	await counter.click();
	await counter.click();

	await expect(counter.first()).toHaveText("2");
});

test("can use Header slot with 'modal: false'", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const container = document.createElement("div");
		document.body.append(container);

		new FindkitUI({
			publicToken: "po8GK3G0r",
			modal: false,
			container,
			slots: {
				Header() {
					return html`<div class="header-slot">Works</div> `;
				},
			},
		});
	});

	const headerSlot = page.locator(".header-slot");
	await expect(headerSlot).toBeVisible();
});

test("can use Content slot with 'modal: false'", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const container = document.createElement("div");
		document.body.append(container);

		new FindkitUI({
			publicToken: "po8GK3G0r",
			modal: false,
			container,
			slots: {
				Content() {
					return html`<div class="content-slot">Works</div> `;
				},
			},
		});
	});

	const slot = page.locator(".content-slot");
	await expect(slot).toBeVisible();
});

test("can use useTotalHitCount() in Content slot", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html, useTotalHitCount } = MOD;

		const container = document.createElement("div");
		document.body.append(container);

		new FindkitUI({
			publicToken: "po8GK3G0r",
			modal: false,
			container,
			slots: {
				Content(props) {
					const count = useTotalHitCount();
					return html`<div>
						<div class="count">${count}</div>
						<div>${props.children}</div>
					</div>`;
				},
			},
		});
	});

	const count = page.locator(".count");
	await expect(count).toBeVisible();
	expect(await count.innerText()).toEqual("0");

	await page.locator("input").fill("test");

	await expect
		.poll(async () => {
			return count.evaluate((el) => Number(el.textContent) || 0);
		})
		.toBeGreaterThan(0);
});

test("calls the global FINDKIT_GET_JWT_TOKEN when defined", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		Object.assign(window, {
			__count: 0,
			async FINDKIT_GET_JWT_TOKEN() {
				this.__count++;
			},
		});

		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			params: {
				tagQuery: [],
			},
		});

		ui.open("test");
	});

	await expect
		.poll(async () => {
			return await page.evaluate(async () => {
				return (window as any).__count as number;
			});
		})
		.toBeGreaterThan(0);
});

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

test("renders nice error when wrongly rendering custom fields", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { html, FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			slots: {
				Hit(props) {
					// Crashes because Preact cannot render objects.
					// Should be: props.hit.customFields.price?.value
					return html`${props.hit.customFields.price}`;
				},
			},
		});

		ui.open("diamond");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect(hits.first()).toContainText('Error rendering slot "Hit"');
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

test("updated params are synchronously available when loaded", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	const params = await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "pW1D0p0Dg" });
		await ui.preload();
		ui.updateParams({ tagBoost: { ding: 1 } });
		return ui.params;
	});

	expect(params).toEqual({ tagBoost: { ding: 1 } });
});

test("all group params are optional", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	const ids = await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 0,
			groups: [{}, {}],
		});
		ui.open();

		await ui.preload();

		return ui.groups.map((g) => g.id);
	});

	expect(ids).toEqual(["group-1", "group-2"]);

	const groups = page.locator(".findkit--group");
	await expect(groups).toHaveCount(2);

	const hits = page.locator(".findkit--hit");
	// 5 is the default preview size per group
	await expect(hits).toHaveCount(10);
});
