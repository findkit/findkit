import { expect, test } from "@playwright/test";
import {
	getHitHosts,
	mockSearchResponses,
	oneEvent,
	staticEntry,
} from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can render the search view to a custom container", async ({ page }) => {
	await page.goto(staticEntry("/custom-container"));
	const hits = page.locator(".findkit--hit");

	const input = page.locator('[aria-label="Search input"]');
	await input.fill("valu");

	await hits.first().waitFor({ state: "visible" });
});

test("can use custom input (.bindInput()) and 'params' events", async ({
	page,
}) => {
	await page.goto(staticEntry("/custom-container-customized"));
	const hits = page.locator(".findkit--hit");

	const input = page.locator("#custom-search-input");
	await input.fill("valu");

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

test("can use useTotal()", async ({ page }) => {
	await page.goto(staticEntry("/custom-container"));
	const hits = page.locator(".findkit--hit");

	const input = page.locator('[aria-label="Search input"]');
	await input.fill("valu");

	await hits.first().waitFor({ state: "visible" });

	await expect(page.locator(".test-terms")).toHaveText("valu");
	const total = await page.locator(".test-total").innerText();

	expect(Number(total)).toBeGreaterThan(10);
});

test("modal is automatically disabled when using custom container", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const div = document.createElement("div");
		document.body.appendChild(div);
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			container: div,
		});
		ui.open();
	});

	const plainContainer = page.locator(".findkit--plain");
	await expect(plainContainer).toBeVisible();

	const modal = page.locator(".findkit--modal");
	await expect(modal).not.toBeVisible();
});

test("can force modal to customer container by setting modal:true", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const div = document.createElement("div");
		document.body.appendChild(div);
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			container: div,
			modal: true,
		});
		ui.open();
	});

	const modal = page.locator(".findkit--modal");
	await expect(modal).toBeVisible();

	const plainContainer = page.locator(".findkit--plain");
	await expect(plainContainer).not.toBeVisible();
});

test("implementation is loaded immediately with a custom container", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const div = document.createElement("div");
		document.body.appendChild(div);
		new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			container: div,
		});
	});

	const plainContainer = page.locator(".findkit--plain");
	await expect(plainContainer).toBeVisible();
});

test("can search immediately after creating with custom container", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));
	await mockSearchResponses(page);

	await page.evaluate(async () => {
		const div = document.createElement("div");
		document.body.appendChild(div);
		const ui = new MOD.FindkitUI({
			publicToken: "test",
			container: div,
		});

		ui.open("test");
	});

	const hit = page.locator(".findkit--hit a").first();
	const input = page.locator(".findkit--search-input");

	await expect(hit).toBeVisible();
	await expect(input).toHaveValue("test");
});
