import { test, expect } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries/index";
import { getHitHosts, spinnerLocator } from "./helpers";

declare const ui: FindkitUI;

test("can load more results when using only one group", async ({ page }) => {
	await page.goto("/single-group");
	const hits = page.locator(".findkit--hit");
	const loading = spinnerLocator(page);

	const button = page.locator("text=open");

	await button.click();

	const input = page.locator("input:visible");

	await input.type("valu");

	await hits.first().waitFor({ state: "visible" });

	await page.locator(".findkit--more-link").first().waitFor({
		state: "detached",
	});

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);

	await page.locator(".findkit--load-more-button").first().click();

	await loading.waitFor({ state: "hidden" });

	const hitCount2 = await hits.count();
	expect(hitCount2).toBeGreaterThan(hitCount1);

	await page
		.locator(".findkit--back-link")
		.first()
		.waitFor({ state: "detached" });
});

test("the input is cleared when the modal is closed", async ({ page }) => {
	await page.goto("/single-group");
	const hits = page.locator(".findkit--hit");

	await page.locator("text=open").click();
	await page.locator("input:visible").type("mikko");

	await hits.first().waitFor({ state: "visible" });

	await page.keyboard.press("Escape");

	await page.locator("text=open").click();

	expect(await page.locator('[aria-label="Search input"]').inputValue()).toBe(
		"",
	);
});

test("search input is focused on open and restored back to opening element when closing", async ({
	page,
}) => {
	await page.goto("/single-group");

	const button = page.locator("text=open");

	await button.click();

	await expect(page.locator('[aria-label="Search input"]')).toBeFocused();

	await page.keyboard.press("Escape");

	await expect(button).toBeFocused();
});

test.describe("small window", () => {
	test.use({
		viewport: {
			width: 600,
			height: 600,
		},
	});

	test("hides the search input on scroll", async ({ page }) => {
		await page.goto("/single-group", {});

		const button = page.locator("text=open");
		const input = page.locator('[aria-label="Search input"]');
		const header = page.locator(".findkit--header");

		await button.click();
		await input.type("mikko");

		const hits = page.locator(".findkit--hit");
		await hits.first().waitFor({ state: "visible" });

		// Should hide when scrolling down
		await page.mouse.wheel(0, 300);
		await expect(header).toHaveClass(/hidden/);

		// Restores on scroll up
		await page.mouse.wheel(0, -200);
		await expect(header).not.toHaveClass(/hidden/);

		// Hide and close
		await page.mouse.wheel(0, 300);
		await page.keyboard.press("Escape");

		// Should be visible again when opening again
		await page.locator("text=open").click();
		await expect(header).not.toHaveClass(/hidden/);
	});
});

test("can open the search progmatically", async ({ page }) => {
	await page.goto("/single-group");
	await page.evaluate(async () => {
		await ui.open("mikko");
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });
	expect(await input.inputValue()).toBe("mikko");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });
});

test("can open the search progmatically without terms", async ({ page }) => {
	await page.goto("/single-group");
	await page.evaluate(async () => {
		await ui.open();
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });
});

test("emits debounced-search event", async ({ page }) => {
	await page.goto("/single-group");
	await page.locator("text=open").click();

	const termsPromise = page.evaluate(async () => {
		return await new Promise<string>((resolve) => {
			ui.events.on("debounced-search", (e) => {
				resolve(e.terms);
			});
		});
	});

	const input = page.locator('[aria-label="Search input"]');
	await input.type("valu ");
	await page.waitForTimeout(500);
	await input.type("wordpress");

	expect(await termsPromise).toEqual("valu wordpress");
});

test("can navigate to hit and come back retaining url and input value", async ({
	page,
}) => {
	await page.goto("/single-group");
	const hits = page.locator(".findkit--hit a");
	await page.locator("text=open").click();

	const input = page.locator('[aria-label="Search input"]');
	await input.type("wordpress");
	const hitUrl = await hits.first().getAttribute("href");
	await hits.first().click();

	await page.waitForLoadState("domcontentloaded");
	expect(page.url()).toContain(hitUrl);

	await page.goBack();

	await expect(page).toHaveURL(/fdk_q=wordpress/);
	await expect.poll(async () => input.inputValue()).toBe("wordpress");
});

test("emits hit-click events and can prevent default", async ({ page }) => {
	await page.goto("/single-group");
	const hits = page.locator(".findkit--hit a");
	await page.locator("text=open").click();

	const clickPromise = page.evaluate(async () => {
		return await new Promise<any>((resolve) => {
			ui.events.on("hit-click", (e) => {
				e.preventDefault();
				resolve({
					url: e.hit.url,
					terms: e.terms,
				});
			});
		});
	});

	const input = page.locator('[aria-label="Search input"]');
	await input.type("wordpress");
	const hitUrl = await hits.first().getAttribute("href");
	await hits.first().click();

	expect(page.url()).toContain("single-group");

	const click = await clickPromise;
	expect(click.url).toEqual(hitUrl);
});

test("can update groups on the fly", async ({ page }) => {
	await page.goto("/single-group");
	await page.locator("text=open").click();

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');
	await input.type("valu");
	await hits.first().waitFor({ state: "visible" });

	expect(await getHitHosts(page)).toEqual(["www.valu.fi"]);

	await page.evaluate(async () => {
		await ui.updateGroups([
			{
				id: "statement",
				title: "statement.fi",
				tagQuery: [["domain/statement.fi"]],
				highlightLength: 10,
				scoreBoost: 1,
				previewSize: 5,
			},
		]);
	});

	const loading = spinnerLocator(page);
	await loading.waitFor({ state: "hidden" });

	expect(await getHitHosts(page)).toEqual(["statement.fi"]);
});

test("can update groups on the fly with update function", async ({ page }) => {
	await page.goto("/single-group");
	await page.locator("text=open").click();

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');
	await input.type("valu");
	await hits.first().waitFor({ state: "visible" });

	expect(await getHitHosts(page)).toEqual(["www.valu.fi"]);

	await page.evaluate(async () => {
		await ui.updateGroups((groups) => {
			const group = groups[0];
			if (group) {
				group.tagQuery = [["domain/statement.fi"]];
			}
		});
	});

	const loading = spinnerLocator(page);
	await loading.waitFor({ state: "hidden" });

	expect(await getHitHosts(page)).toEqual(["statement.fi"]);
});

test("can infinite scroll", async ({ page }) => {
	await page.goto("/single-group");

	await page.evaluate(async () => {
		const anyWindow = window as any;
		anyWindow.COUNT = 0;
		ui.events.on("fetch", () => {
			anyWindow.COUNT++;
		});
	});

	async function getFetchCount() {
		return await page.evaluate(async () => {
			const anyWindow = window as any;
			return anyWindow.COUNT as number;
		});
	}

	await page.locator("text=open").click();

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');
	await input.type("valu");
	await hits.first().waitFor({ state: "visible" });

	const count = await hits.count();

	// Move focus away from the input to ensure that the End key scrolls and
	// does not move the text cursor. Required on Linux.
	await page.keyboard.press("Tab");

	await page.keyboard.press("End");

	await expect.poll(async () => hits.count()).toBeGreaterThan(count);

	expect(await getFetchCount()).toBe(2);
});
