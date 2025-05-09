import { test, expect } from "@playwright/test";
import { assertNotNil } from "@valu/assert";
import type { FindkitUI } from "../src/cdn-entries/index";
import { getHitHosts, staticEntry } from "./helpers";

declare const ui: FindkitUI;

test("can load more results when using only one group", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));
	const hits = page.locator(".findkit--hit");

	const button = page.locator("button", { hasText: "open" });

	await button.click();

	const input = page.locator("input:visible");

	await input.fill("valu");

	await hits.first().waitFor({ state: "visible" });

	await page.locator(".findkit--more-link").first().waitFor({
		state: "detached",
	});

	const hitCount1 = await hits.count();
	expect(hitCount1).toBeGreaterThan(2);

	await page.locator(".findkit--load-more-button").first().click();

	await expect.poll(() => hits.count()).toBeGreaterThan(hitCount1);

	await page
		.locator(".findkit--back-link")
		.first()
		.waitFor({ state: "detached" });
});

test("the input is cleared when the modal is closed", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));
	const hits = page.locator(".findkit--hit");

	await page.locator("button", { hasText: "open" }).click();
	await page.locator("input:visible").fill("mikko");

	await hits.first().waitFor({ state: "visible" });

	await page.keyboard.press("Escape");

	await page.locator("button", { hasText: "open" }).click();

	expect(await page.locator('[aria-label="Search input"]').inputValue()).toBe(
		"",
	);
});

test("search input is focused on open and restored back to opening element when closing", async ({
	page,
	browserName,
}) => {
	// XXX Should probaly work on safari too?
	if (browserName === "webkit") {
		return;
	}

	await page.goto(staticEntry("/single-group"));

	const button = page.locator("button", { hasText: "open" });

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
		await page.goto(staticEntry("/single-group"));

		const button = page.locator("button", { hasText: "open" });
		const input = page.locator('[aria-label="Search input"]');
		const header = page.locator(".findkit--header");

		await button.click();
		await input.fill("mikko");

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
		await button.click();
		await expect(header).not.toHaveClass(/hidden/);
	});
});

test("can open the search progmatically", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));
	await page.evaluate(async () => {
		ui.open("mikko");
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });
	expect(await input.inputValue()).toBe("mikko");

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });
});

test("can open the search progmatically without terms", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));
	await page.evaluate(async () => {
		ui.open();
	});

	const input = page.locator('[aria-label="Search input"]');

	await input.waitFor({ state: "visible" });
});

test("emits debounced-search event", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));
	const button = page.locator("button", { hasText: "open" });
	await button.click();

	const termsPromise = page.evaluate(async () => {
		return await new Promise<string>((resolve) => {
			ui.on("debounced-search", (e) => {
				resolve(e.terms);
			});
		});
	});

	const input = page.locator('[aria-label="Search input"]');
	await input.pressSequentially("valu ");
	await page.waitForTimeout(500);
	await input.pressSequentially("wordpress");

	expect(await termsPromise).toEqual("valu wordpress");
});

test("can navigate to hit and come back retaining url and input value", async ({
	page,
}) => {
	await page.goto(staticEntry("/single-group"));
	const hits = page.locator(".findkit--hit a");
	const button = page.locator("button", { hasText: "open" });
	await button.click();

	const input = page.locator('[aria-label="Search input"]');
	await input.fill("wordpress");
	const hitUrl = await hits.first().getAttribute("href");
	await hits.first().click();

	await page.waitForLoadState("domcontentloaded");
	expect(page.url()).toContain(hitUrl);

	await page.goBack();

	await expect(page).toHaveURL(/fdk_q=wordpress/);
	await expect.poll(async () => input.inputValue()).toBe("wordpress");
});

test("can update groups on the fly", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));
	const button = page.locator("button", { hasText: "open" });
	await button.click();

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');
	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	expect(await getHitHosts(page)).toEqual(["www.valu.fi"]);

	await page.evaluate(async () => {
		ui.updateGroups([
			{
				id: "statement",
				title: "statement.fi",
				params: {
					highlightLength: 10,
					tagQuery: [["domain/statement.fi"]],
				},
				relevancyBoost: 1,
				previewSize: 5,
			},
		]);
	});

	await expect.poll(() => getHitHosts(page)).toEqual(["statement.fi"]);
});

test("can update groups on the fly with update function", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));
	const button = page.locator("button", { hasText: "open" });
	await button.click();

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');
	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	expect(await getHitHosts(page)).toEqual(["www.valu.fi"]);

	await page.evaluate(async () => {
		ui.updateGroups((group) => {
			group.params.tagQuery = [["domain/statement.fi"]];
		});
	});

	await expect.poll(() => getHitHosts(page)).toEqual(["statement.fi"]);
});

test("can infinite scroll", async ({ page, browserName }) => {
	const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
	await page.goto(staticEntry("/single-group"));

	await page.evaluate(async () => {
		const anyWindow = window as any;
		anyWindow.COUNT = 0;
		ui.on("fetch", () => {
			anyWindow.COUNT++;
		});
	});

	async function getFetchCount() {
		return await page.evaluate(async () => {
			const anyWindow = window as any;
			return anyWindow.COUNT as number;
		});
	}

	const button = page.locator("button", { hasText: "open" });
	await button.click();

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');
	await input.fill("valu");
	await hits.first().waitFor({ state: "visible" });

	const count = await hits.count();

	// Move focus away from the input to ensure that the End key scrolls and
	// does not move the text cursor. Required on Linux.
	await page.keyboard.press(tab);

	await page.keyboard.press("End");

	await expect.poll(async () => hits.count()).toBeGreaterThan(count);

	expect(await getFetchCount()).toBe(2);
});

test("can click url link after scrolling", async ({ page }) => {
	await page.goto(staticEntry("/single-group"));

	const button = page.locator("text=open");
	const input = page.locator('[aria-label="Search input"]');
	const header = page.locator(".findkit--header");
	const hitUrlLink = page.locator(".findkit--hit-url");
	// const hitUrlLink = page.locator(".findkit--hit-title-link");

	await button.click();
	await input.fill("mikko");

	await hitUrlLink.first().waitFor({ state: "visible" });

	await page.mouse.wheel(0, 300);
	await page.waitForTimeout(300);
	await expect(header).toHaveClass(/hidden/);

	const hitUrl = await hitUrlLink.nth(5).getAttribute("href");
	assertNotNil(hitUrl);

	await hitUrlLink.nth(5).click();
	await expect(page).toHaveURL(hitUrl + "/");
});

test("single group without results displayes 'no search results' text", async ({
	page,
}) => {
	await page.goto(staticEntry("/single-group"));

	const button = page.locator("text=open");
	const input = page.locator('[aria-label="Search input"]');
	const footer = page.locator(".findkit--footer");

	await button.click();
	await input.fill("foobarbazfoobarbazfoobarbaz");

	await footer.first().waitFor({ state: "visible" });
	assertNotNil(footer);

	// takes some time for the UI to update
	// using expect.poll to wait for the text to change rather than a fixed timeout
	await expect
		.poll(async () => {
			const text = await footer.innerText();
			// Trim to handle any extra whitespace
			return text.trim();
		})
		.toBe("No results");

	// addutinal check that no hits are displayed
	const hits = page.locator(".findkit--hit");
	await expect(hits).toHaveCount(0);
});
