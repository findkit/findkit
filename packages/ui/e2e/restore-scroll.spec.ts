import { Page, expect, test } from "@playwright/test";
import { routeMocks, scrollToHit, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

async function testModal(page: Page) {
	await page.locator("text=open").first().click();
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = await scrollToHit(page, "Running Shoes");

	await theHit.locator("a").first().click();

	await page.waitForLoadState("domcontentloaded");

	await page.goBack();

	await page.waitForLoadState("domcontentloaded");

	expect(await page.evaluate(() => (window as any).uiEvents)).toEqual([]);

	await expect(theHit).toBeInViewport();

	await scrollToHit(page, "Leather Boots");

	expect(
		await page.evaluate(() => (window as any).uiEvents.length),
	).toBeGreaterThan(0);
}

async function testContainer(page: Page) {
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = await scrollToHit(page, "Running Shoes");

	await theHit.locator("a").first().click();

	await page.waitForLoadState("domcontentloaded");

	await page.goBack();

	await page.waitForLoadState("domcontentloaded");

	await expect(theHit).toBeInViewport();

	expect(await page.evaluate(() => (window as any).uiEvents)).toEqual([]);

	await scrollToHit(page, "Leather Boots");

	expect(
		await page.evaluate(() => (window as any).uiEvents.length),
	).toBeGreaterThan(0);
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

test("can restore multi group search with forward button", async ({ page }) => {
	const showMore = page.locator("text=Show more search results").first();

	await page.goto(staticEntry("/two-groups-v2?minTerms=0"));

	await page.locator("button").first().click();

	await page.locator(".findkit--header").waitFor({ state: "visible" });

	await showMore.scrollIntoViewIfNeeded();
	await showMore.click();

	const theHit = await scrollToHit(page, "Running Shoes");

	// The timeouts are required for the animations to play and throttled
	// scroll events to fire

	await page.waitForTimeout(500);

	await page.goBack();

	await page.waitForTimeout(500);

	await page.goBack();

	await page.waitForTimeout(500);

	await page.goForward();

	await page.waitForTimeout(500);

	await page.goForward();

	await page.waitForTimeout(500);

	await expect(theHit).toBeVisible();
	await expect(theHit).toBeInViewport();
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

	const theHit = await scrollToHit(page, "Running Shoes");

	await page.locator("text=External Link").click();
	await page.waitForLoadState("domcontentloaded");

	await page.goBack();

	await page.waitForLoadState("domcontentloaded");

	await initUI();

	await expect(theHit).toBeInViewport();

	await scrollToHit(page, "Leather Boots");

	expect(
		await page.evaluate(() => (window as any).uiEvents.length),
	).toBeGreaterThan(0);
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

			const uiEvents: any[] = [];

			ui.on("fetch", () => {
				uiEvents.push("fetch");
			});

			Object.assign(window, { ui, uiEvents });
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
				trap: false,
				css: `
					.findkit--modal-container {
						top: 100px;
					}
				`,
			});
			const uiEvents: any[] = [];

			ui.on("fetch", () => {
				uiEvents.push("fetch");
			});

			Object.assign(window, { ui, uiEvents });
		});
	}

	await routeMocks(page);
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

	const theHit = await scrollToHit(page, "Running Shoes");

	// Ensure throttle timeout fired
	await page.waitForTimeout(500);

	await page.goBack();

	await page.waitForTimeout(500);

	await page.goForward();

	await expect(theHit).toBeInViewport();

	await scrollToHit(page, "Leather Boots");

	expect(
		await page.evaluate(() => (window as any).uiEvents.length),
	).toBeGreaterThan(0);
});

test("modal: reload makes a new search", async ({ page }) => {
	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("text=open").click();
	await page.locator("input").fill("a");

	const theHit = await scrollToHit(page, "Running Shoes");

	// wait for throttled save
	await page.waitForTimeout(500);

	await page.reload();

	await page.waitForLoadState("domcontentloaded");

	const hit = page.locator(".findkit--hit").first();

	await hit.waitFor({ state: "visible" });

	await expect(theHit).toBeHidden();

	expect(await page.evaluate(() => (window as any).uiEvents.length)).toBe(1);
});

test("container: reload makes a new search", async ({ page }) => {
	await page.goto(staticEntry("/slowly-loading"));

	await page.locator("input").fill("a");

	const theHit = await scrollToHit(page, "Running Shoes");

	// wait for throttled save
	await page.waitForTimeout(500);

	await page.reload();

	await page.waitForLoadState("domcontentloaded");

	const hit = page.locator(".findkit--hit").first();

	await hit.waitFor({ state: "visible" });

	await expect(theHit).toBeHidden();

	expect(await page.evaluate(() => (window as any).uiEvents.length)).toBe(1);
});

test("can restore modified and created dates from sessionStorage on back", async ({
	page,
}) => {
	await routeMocks(page);
	await page.goto(staticEntry("/date-props"));
	await testModal(page);
	await page.reload();
	await page.waitForLoadState("domcontentloaded");
	const errors = page.locator(".findkit--error");
	await expect(errors).not.toBeVisible();
});
