import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("modal: sets view classes", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			groups: [
				{
					id: "valu",
					title: "Valu.fi",
					relevancyBoost: 1,
					previewSize: 5,
					params: {
						tagQuery: [["domain/valu.fi"]],
						highlightLength: 10,
					},
				},
				{
					id: "statement",
					title: "Statement.fi",
					relevancyBoost: 1,
					previewSize: 5,
					params: {
						tagQuery: [["domain/statement.fi"]],
						highlightLength: 10,
					},
				},
			],
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	const allLink = page.locator("text=Show more search results");
	const input = page.locator('[aria-label="Search input"]');
	const modalContainer = page.locator(".findkit--modal");

	await input.fill("wordpress");
	await hits.first().waitFor({ state: "visible" });

	await expect(modalContainer).toHaveClass(/findkit--view-groups/);
	await expect(modalContainer).not.toHaveClass(/findkit--view-single/);

	await allLink.first().click();

	await expect(modalContainer).not.toHaveClass(/findkit--view-groups/);
	await expect(modalContainer).toHaveClass(/findkit--view-single/);

	await page.goBack();

	await expect(modalContainer).toHaveClass(/findkit--view-groups/);
	await expect(modalContainer).not.toHaveClass(/findkit--view-single/);
});

test("plain: sets view classes", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const div = document.createElement("div");
		document.body.appendChild(div);
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			minTerms: 0,
			modal: false,
			container: div,
			groups: [
				{
					id: "valu",
					title: "Valu.fi",
					relevancyBoost: 1,
					previewSize: 5,
					params: {
						tagQuery: [["domain/valu.fi"]],
						highlightLength: 10,
					},
				},
				{
					id: "statement",
					title: "Statement.fi",
					relevancyBoost: 1,
					previewSize: 5,
					params: {
						tagQuery: [["domain/statement.fi"]],
						highlightLength: 10,
					},
				},
			],
		});

		ui.open();
	});

	const hits = page.locator(".findkit--hit");
	const allLink = page.locator("text=Show more search results");
	const input = page.locator('[aria-label="Search input"]');
	const plainContainer = page.locator(".findkit--plain");

	await input.fill("wordpress");
	await hits.first().waitFor({ state: "visible" });

	await expect(plainContainer).toHaveClass(/findkit--view-groups/);
	await expect(plainContainer).not.toHaveClass(/findkit--view-single/);

	await allLink.first().click();

	await expect(plainContainer).not.toHaveClass(/findkit--view-groups/);
	await expect(plainContainer).toHaveClass(/findkit--view-single/);

	await page.locator("text=Back").first().click();

	await expect(plainContainer).toHaveClass(/findkit--view-groups/);
	await expect(plainContainer).not.toHaveClass(/findkit--view-single/);
});
