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

	const groupA = page.locator(".findkit--group-title", { hasText: "GroupA" });
	const groupB = page.locator(".findkit--group-title", { hasText: "GroupB" });

	await expect(groupB).toBeVisible();
	await expect(groupA).not.toBeVisible();

	expect(await page.evaluate(() => testEvents.length)).toBe(1);

	await page.evaluate(async () => {
		ui.activateGroup(0);
	});

	await expect(groupB).not.toBeVisible();
	await expect(groupA).toBeVisible();

	expect(await page.evaluate(() => testEvents.length)).toBe(2);

	await page.evaluate(async () => {
		ui.clearGroup();
	});

	await expect(groupB).toBeVisible();
	await expect(groupA).toBeVisible();
});

test("can use .activateGroup() from a <a> click event", async ({ page }) => {
	await page.goto(staticEntry("/dummy?fdk_q=a&fdk_id=group-a"));

	await page.evaluate(async () => {
		const { FindkitUI, html, useResults } = MOD;

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			infiniteScroll: false,
			minTerms: 1,
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
			slots: {
				Header(props) {
					const results = useResults();

					return html`
						${results.map((group) => {
							const activate = (e: any) => {
								e.preventDefault();
								return ui.activateGroup(group.id);
							};
							return html`
								<a class="tab ${group.id}" href="#" onClick=${activate}
									>${group.title}</a
								>
							`;
						})}
						${props.children}
					`;
				},
			},
		});

		const testEvents: any[] = [];
		Object.assign(window, { ui, testEvents });

		ui.on("fetch", () => {
			testEvents.push("fetch");
		});
	});

	const groupA = page.locator(".findkit--group-title", { hasText: "GroupA" });
	const groupB = page.locator(".findkit--group-title", { hasText: "GroupB" });

	await expect(groupB).not.toBeVisible();
	await expect(groupA).toBeVisible();

	await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

	await page.locator("a.tab.group-b").click();

	await expect(groupB).toBeVisible();
	await expect(groupA).not.toBeVisible();

	await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

	expect(await page.evaluate(() => testEvents.length)).toBe(2);
});
