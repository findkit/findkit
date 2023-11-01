import { Page, expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

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
}

async function testModal(page: Page) {
	await page.evaluate(async () => {
		history.replaceState({ my: "test" }, "", location.href);
	});

	await page.locator("text=open").first().click();
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = hits.filter({ hasText: "Leather Boots" }).first();

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

	// Other history is not affected
	expect(
		await page.evaluate(async () => {
			return history.state;
		}),
	).toMatchObject({ my: "test" });
}

async function testContainer(page: Page) {
	await page.locator("text=open").first().click();
	await page.locator("input").fill("a");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const theHit = hits.filter({ hasText: "Leather Boots" }).first();

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
