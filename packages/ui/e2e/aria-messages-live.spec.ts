import { expect, test } from "@playwright/test";
import { mockSearchResponses, pressTab, staticEntry } from "./helpers";

test("read results on enter press and clear the aria-live element when unfocusing the input", async ({
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

	await expect(ariaLive).not.toBeAttached();

	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText(
		"3 results found. Focus first result with shift enter",
	);

	await pressTab(page);

	await expect(ariaLive).not.toBeAttached();
});

test("reads loading message", async ({ page }) => {
	await mockSearchResponses(page, 500);

	await page.goto(staticEntry("/single-group-v2"));

	const input = page.locator("input");
	const ariaLive = page.locator(
		".findkit--results-aria-live-message[aria-live]",
	);

	await page.locator("button").click();

	await input.pressSequentially("a");

	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText("Loading results...");

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

	await expect(ariaLive).not.toBeAttached();

	await page.keyboard.press("Enter");

	await expect(ariaLive).toHaveText(
		"3 results found in 2 groups. Focus first result with shift enter",
	);

	await page.locator("text=Show more search results").first().click();
	await page.locator("text=Back").waitFor({ state: "visible" });
	await expect(ariaLive).not.toBeAttached();

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
