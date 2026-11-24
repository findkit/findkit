import { expect, test } from "@playwright/test";
import { mockSearchResponses, pressTab, staticEntry } from "./helpers";

test("read results on enter press and clear the aria-live message when unfocusing the input", async ({
	page,
}) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/single-group-v2"));

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);
	const hit = page.locator(".findkit--hit a").first();

	await page.locator("button").click();
	await input.pressSequentially("a");
	await hit.waitFor({ state: "visible" });

	await expect(ariaLive).toBeEmpty();

	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);

	await pressTab(page);

	await expect(ariaLive).toBeEmpty();
});

test("read results on enter press when using external input", async ({
	page,
}) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/external-input"));

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);
	const hit = page.locator(".findkit--hit a").first();

	await page.locator("button").click();
	await input.pressSequentially("test");
	await hit.waitFor({ state: "visible" });

	await expect(ariaLive).toBeEmpty();

	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);

	await pressTab(page);

	await expect(ariaLive).toBeEmpty();
});

test("read results on enter press when using custom container", async ({
	page,
}) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/custom-container"));

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);
	const hit = page.locator(".findkit--hit a").first();

	await input.pressSequentially("test");
	await hit.waitFor({ state: "visible" });

	await expect(ariaLive).toBeEmpty();

	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);

	await pressTab(page);

	await expect(ariaLive).toBeEmpty();
});

test("reads loading message", async ({ page }) => {
	await mockSearchResponses(page, { slowDown: 500 });

	await page.goto(staticEntry("/single-group-v2"));

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);

	await page.locator("button").click();

	await input.pressSequentially("a");

	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText("Loading search results...");

	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);
});

test("custom message on selected group", async ({ page }) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/two-groups-v2?minTerms=1"));
	await page.locator("button").click();

	const input = page.locator("input");
	const hit = page.locator(".findkit--hit a").first();
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);

	await input.fill("a");
	await hit.waitFor({ state: "visible" });

	await expect(ariaLive).toBeEmpty();

	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText(
		"3 results found in 2 groups. Focus first result with shift enter",
	);

	await page.locator("text=Show more search results").first().click();
	await page.locator("text=Back").waitFor({ state: "visible" });
	await expect(ariaLive).toBeEmpty();

	await input.focus();
	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);
});

test("polite aria-live message is read when navigating to a group and back", async ({
	page,
}) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/two-groups-v2?minTerms=1"));
	await page.locator("button").click();

	const input = page.locator("input");
	const hit = page.locator(".findkit--hit a").first();
	const ariaLive = page.locator(".findkit--content h1[aria-live]");

	await expect(ariaLive).toHaveText("Search results for 2 groups.");

	await input.fill("a");
	await hit.waitFor({ state: "visible" });

	await expect(ariaLive).toHaveText("Search results for 2 groups.");

	await page.locator("text=Show more search results").first().click();

	await expect(ariaLive).toHaveText("Search results for the selected group");

	await page.goBack();

	await expect(ariaLive).toHaveText("Search results for 2 groups.");

	await page.goForward();

	await expect(ariaLive).toHaveText("Search results for the selected group");
});

test("aria-live region is in the DOM before the first announcement", async ({
	page,
}) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("button").click();

	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);

	// Screen readers only announce changes to live regions that already exist
	// https://github.com/findkit/findkit/issues/80
	await expect(ariaLive).toBeAttached();
	await expect(ariaLive).toBeEmpty();
	await expect(ariaLive).toHaveAttribute("aria-live", "assertive");
	await expect(ariaLive).toHaveAttribute("aria-atomic", "true");
});

test("aria-live element is not re-created between announcements", async ({
	page,
}) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("button").click();

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);
	const hit = page.locator(".findkit--hit a").first();

	await input.pressSequentially("a");
	await hit.waitFor({ state: "visible" });

	await ariaLive.evaluate((el) => {
		el.setAttribute("data-test-marker", "original");
	});

	await page.keyboard.press("Enter");
	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);

	await expect(ariaLive).toHaveAttribute("data-test-marker", "original");
});

test("identical message is announced again on repeated enter press", async ({
	page,
}) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("button").click();

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);
	const hit = page.locator(".findkit--hit a").first();
	const message = "3 results found. Focus first result with shift enter";

	await input.pressSequentially("a");
	await hit.waitFor({ state: "visible" });

	await page.keyboard.press("Enter");
	await expect(ariaLive).toHaveText(message);

	await ariaLive.evaluate((el) => {
		const texts: string[] = [];
		(window as any).__ariaLiveTexts = texts;
		new MutationObserver(() => {
			texts.push(el.textContent ?? "");
		}).observe(el, { childList: true, subtree: true, characterData: true });
	});

	await page.keyboard.press("Enter");

	// The live region is cleared and filled again so that screen readers
	// detect a change even though the message is the same
	await expect
		.poll(() => page.evaluate(() => (window as any).__ariaLiveTexts))
		.toEqual(["", message]);
});

test("results are announced after typing stops", async ({ page }) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("button").click();

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);
	const hit = page.locator(".findkit--hit a").first();

	await input.pressSequentially("a");
	await hit.waitFor({ state: "visible" });

	// No Enter press
	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);

	// Typing more clears the outdated message
	await input.pressSequentially("b");
	await expect(ariaLive).toBeEmpty();

	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);
});

test("results are not announced after typing when the input is unfocused", async ({
	page,
}) => {
	await mockSearchResponses(page);

	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("button").click();

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);
	const hit = page.locator(".findkit--hit a").first();

	await input.pressSequentially("a");
	await hit.waitFor({ state: "visible" });
	await pressTab(page);

	await page.waitForTimeout(1500);
	await expect(ariaLive).toBeEmpty();
});

test("search input instructions are referenced with aria-describedby", async ({
	page,
}) => {
	await page.goto(staticEntry("/single-group-v2"));
	await page.locator("button").click();

	const input = page.locator("input");
	const descriptionId = await input.getAttribute("aria-describedby");

	expect(descriptionId).toBeTruthy();
	await expect(input).not.toHaveAttribute("aria-description");

	const description = page.locator(`[id="${descriptionId}"]`);

	// Modal mode has both the general and the modal specific instructions
	await expect(description).toHaveText(
		"Search shows search results automatically as you type. Search results can be browsed with tabulator. Exit search with escape key.",
	);
	await expect(input).toHaveAccessibleDescription(
		"Search shows search results automatically as you type. Search results can be browsed with tabulator. Exit search with escape key.",
	);
});
