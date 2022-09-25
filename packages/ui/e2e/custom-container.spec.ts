import { expect, test } from "@playwright/test";
import { getHitHosts, oneEvent } from "./helpers";

test("can render the search view to a custom container", async ({ page }) => {
	await page.goto("/custom-container");
	const hits = page.locator(".findkit--hit");

	const input = page.locator('[aria-label="Search input"]');
	await input.type("valu");

	await hits.first().waitFor({ state: "visible" });
});

test("can use custom input (.bindInput()) and params-change events", async ({
	page,
}) => {
	await page.goto("/custom-container-customized");
	const hits = page.locator(".findkit--hit");

	const input = page.locator("#custom-search-input");
	await input.type("valu");

	await hits.first().waitFor({ state: "visible" });

	{
		const hosts = await getHitHosts(page);
		expect(hosts).toContain("www.valu.fi");
		expect(hosts).toContain("statement.fi");
	}

	await page.locator("button", { hasText: "statement.fi" }).click();

	while (true) {
		const e = await oneEvent(page, "status");
		if (e.next === "ready") {
			break;
		}
	}

	const hosts = await getHitHosts(page);
	expect(hosts).toEqual(["statement.fi"]);
});

test("can use hooks", async ({ page }) => {
	await page.goto("/custom-container");
	const hits = page.locator(".findkit--hit");

	const input = page.locator('[aria-label="Search input"]');
	await input.type("valu");

	await hits.first().waitFor({ state: "visible" });

	await expect(page.locator(".test-terms")).toHaveText("valu");
	const total = await page.locator(".test-total").innerText();
	const resultLength = await page.locator(".test-results").innerText();

	expect(Number(total)).toBeGreaterThan(10);
	expect(Number(resultLength)).toBeGreaterThan(10);
	expect(Number(total)).toBeGreaterThan(Number(resultLength));
});
