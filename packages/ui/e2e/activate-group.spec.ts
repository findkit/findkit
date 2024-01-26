import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

declare const testEvents: any[];

test("can use .activateGroup() and .clearGroup()", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, css } = MOD;

		document.body.innerHTML = "";

		const input = document.createElement("input");
		input.type = "text";
		document.body.appendChild(input);

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			infiniteScroll: false,
			minTerms: 1,
			header: false,
			css: css`
				.findkit--container {
					margin-top: 100px;
				}
			`,
			groups: [
				{
					title: "GroupA",
					id: "group-a",
				},
				{
					title: "GroupB",
					id: "group-b",
				},
			],
		});

		ui.bindInput(input);

		const testEvents: any[] = [];
		Object.assign(window, { ui, testEvents });

		ui.on("fetch", () => {
			testEvents.push("fetch");
		});

		ui.activateGroup(1);
	});

	await page.fill('input[type="text"]', "a");

	await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

	await expect(page.locator("text=GroupB")).toBeVisible();
	await expect(page.locator("text=GroupA")).not.toBeVisible();

	expect(await page.evaluate(() => testEvents.length)).toBe(1);

	await page.waitForTimeout(1000);

	await page.evaluate(async () => {
		ui.activateGroup(0);
	});

	await expect(page.locator("text=GroupB")).not.toBeVisible();
	await expect(page.locator("text=GroupA")).toBeVisible();

	await page.evaluate(async () => {
		ui.clearGroup();
	});

	await expect(page.locator("text=GroupB")).toBeVisible();
	await expect(page.locator("text=GroupA")).toBeVisible();
});
