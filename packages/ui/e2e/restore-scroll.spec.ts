import { Page, expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

async function routeMocks(page: Page) {
	await page.route(
		(url) => url.hostname === "shop.findkit.invalid",
		(route) => {
			void route.fulfill({
				status: 200,
				contentType: "text/html",
				body: "<html><body><h1>Shop</h1></body></html>",
			});
		},
	);

	await page.route(
		(url) => url.hostname === "other.invalid",
		(route) => {
			void route.fulfill({
				status: 200,
				contentType: "text/html",
				body: "<html><body><h1>Other</h1></body></html>",
			});
		},
	);
}

async function testModal(page: Page) {
	await page.locator("text=open").first().click();
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = hits.filter({ hasText: "Running Shoes" }).first();

	let i = 50;

	while (i--) {
		await page.mouse.wheel(0, 800);
		await page.waitForTimeout(250);
		if (await theHit.isVisible()) {
			break;
		}
	}

	await theHit.scrollIntoViewIfNeeded();

	await theHit.locator("a").first().click();

	await page.waitForLoadState("domcontentloaded");

	await page.goBack();

	await page.waitForLoadState("domcontentloaded");

	expect(await page.evaluate(() => (window as any).uiEvents)).toEqual([]);

	await expect(theHit).toBeInViewport();
}

async function testContainer(page: Page) {
	await page.locator("text=open").first().click();
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = hits.filter({ hasText: "Running Shoes" }).first();

	let i = 50;

	while (i--) {
		await page.mouse.wheel(0, 800);
		await page.waitForTimeout(250);
		if (await theHit.isVisible()) {
			break;
		}
	}

	await theHit.scrollIntoViewIfNeeded();

	await theHit.locator("a").first().click();

	await page.waitForLoadState("domcontentloaded");

	await page.goBack();

	await page.waitForLoadState("domcontentloaded");

	await expect(theHit).toBeInViewport();

	expect(await page.evaluate(() => (window as any).uiEvents)).toEqual([]);
}

test("modal: can restore the scroll position when using back button", async ({
	page,
}) => {
	await routeMocks(page);
	await page.goto(staticEntry("/single-group-v2"));
	await testModal(page);
	expect(page.url()).toContain("?fdk_q=a");
});

test("slowly loading css does not break modal scroll restoration", async ({
	page,
}) => {
	await page.route(
		(url) => url.pathname.endsWith("styles.css"),
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async (route) => {
			await new Promise((f) => setTimeout(f, 1000));
			await route.continue();
		},
	);
	await routeMocks(page);
	await page.goto(staticEntry("/single-group-v2"));
	await testModal(page);
	expect(page.url()).toContain("?fdk_q=a");
});

test("custom container: can restore the scroll position when using back button", async ({
	page,
}) => {
	await routeMocks(page);
	await page.goto(staticEntry("/slowly-loading"));
	await testContainer(page);
	expect(page.url()).toContain("?fdk_q=a");
});

test("modal with hash router: can restore the scroll position when using back button", async ({
	page,
}) => {
	await routeMocks(page);
	await page.goto(staticEntry("/single-group-v2?router=hash"));
	await testModal(page);
	expect(page.url()).toContain("#fdk_q=a");
});

test("custom container with hash router: can restore the scroll position when using back button", async ({
	page,
}) => {
	await routeMocks(page);
	await page.goto(staticEntry("/slowly-loading?router=hash"));
	await testContainer(page);
	expect(page.url()).toContain("#fdk_q=a");
});

test("restore scroll when going back from single group view with the browser back button", async ({
	page,
}) => {
	await page.setViewportSize({
		width: 375,
		height: 667,
	});

	const hits = page.locator(".findkit--hit");
	const showMore = page.locator("text=Show more search results").first();

	await page.goto(
		staticEntry("/two-groups-v2?fdk_q=&minTerms=0&noShadowDom=1"),
	);

	await hits.first().waitFor({ state: "visible" });

	await showMore.scrollIntoViewIfNeeded();

	const initialScrollTop = await page.evaluate(
		() => document.querySelector(".findkit--modal")?.scrollTop,
	);

	expect(initialScrollTop).toBeGreaterThan(50);

	await showMore.click();

	await expect.poll(() => page.url()).toContain("fdk_id=");

	await page.goBack();

	await page.waitForTimeout(200);

	const restoredScrollTop = await page.evaluate(
		() => document.querySelector(".findkit--modal")?.scrollTop,
	);

	expect(restoredScrollTop).toBe(initialScrollTop);
});

async function testExternalLink(page: Page, initUI: () => Promise<void>) {
	await page.goto(staticEntry("/dummy"));

	await initUI();

	await page.evaluate(async () => {
		ui.open();
	});

	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = hits.filter({ hasText: "Running Shoes" }).first();

	let i = 100;

	while (i--) {
		await page.mouse.wheel(0, 800);
		await page.waitForTimeout(250);
		if (await theHit.isVisible()) {
			break;
		}
	}

	await theHit.scrollIntoViewIfNeeded();

	await page.locator("text=External Link").click();
	await page.waitForLoadState("domcontentloaded");

	await page.goBack();

	await page.waitForLoadState("domcontentloaded");

	await initUI();

	await expect(theHit).toBeInViewport();
}

test("external link in slot override saves scroll position", async ({
	page,
}) => {
	async function initUI() {
		await page.evaluate(async () => {
			const { FindkitUI, html } = MOD;

			const ui = new FindkitUI({
				publicToken: "pW1D0p0Dg",
				minTerms: 0,
				slots: {
					Hit(props) {
						if (props.hit.title !== "Running Shoes") {
							return props.children;
						}

						return html`
							<a href="https://other.invalid">External Link</a>
							${props.children}
						`;
					},
				},
			});

			Object.assign(window, { ui });
		});
	}

	await routeMocks(page);
	await testExternalLink(page, initUI);
});

test("external link in page header saves scroll position", async ({ page }) => {
	async function initUI() {
		await page.evaluate(async () => {
			const { FindkitUI } = MOD;
			const header = document.createElement("header");
			header.innerHTML = `<a href="https://other.invalid">External Link</a>`;
			document.body.prepend(header);

			const ui = new FindkitUI({
				publicToken: "pW1D0p0Dg",
				minTerms: 0,
				css: `
					.findkit--modal-container {
						top: 100px;
					}
				`,
			});

			ui.trapFocus(header);

			Object.assign(window, { ui });
		});
	}

	await routeMocks(page);
	await page.mouse.move(200, 200);
	await testExternalLink(page, initUI);
});

test("modal: can restore the scroll position when using forward button", async ({
	page,
}) => {
	await routeMocks(page);
	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("text=open").click();
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = hits.filter({ hasText: "Running Shoes" }).first();

	let i = 100;

	while (i--) {
		await page.mouse.wheel(0, 800);
		await page.waitForTimeout(250);
		if (await theHit.isVisible()) {
			break;
		}
	}

	await theHit.scrollIntoViewIfNeeded();

	// Ensure throttle timeout fired
	await page.waitForTimeout(500);

	await page.goBack();

	await page.waitForTimeout(500);

	await page.goForward();

	await expect(theHit).toBeInViewport();
});

test("modal: can restore the scroll position after reload", async ({
	page,
}) => {
	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("text=open").click();
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = hits.filter({ hasText: "Running Shoes" }).first();

	let i = 100;

	while (i--) {
		await page.mouse.wheel(0, 800);
		await page.waitForTimeout(250);
		if (await theHit.isVisible()) {
			break;
		}
	}

	await theHit.scrollIntoViewIfNeeded();

	await page.reload();

	await expect(theHit).toBeInViewport();

	// No fetches should have been made after the reload
	expect(await page.evaluate(() => (window as any).uiEvents)).toEqual([]);
});

test("container: can restore the scroll position after reload", async ({
	page,
}) => {
	await page.goto(staticEntry("/slowly-loading"));

	await page.locator("text=open").first().click();
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = hits.filter({ hasText: "Running Shoes" }).first();

	let i = 50;

	while (i--) {
		await page.mouse.wheel(0, 800);
		await page.waitForTimeout(250);
		if (await theHit.isVisible()) {
			break;
		}
	}

	await theHit.scrollIntoViewIfNeeded();

	await page.reload();

	await page.waitForLoadState("domcontentloaded");

	await expect(theHit).toBeInViewport();

	expect(await page.evaluate(() => (window as any).uiEvents)).toEqual([]);
});
