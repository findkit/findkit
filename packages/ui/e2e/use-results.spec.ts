import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can use useResults() hook", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, useResults, html, css } = MOD;

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
			css: css`
				[data-group] {
					height: 100px;
				}
				.tabs span {
					margin: 10px;
					padding: 10px;
					border: 1px dashed red;
				}
			`,
			slots: {
				Header(props) {
					const results = useResults();
					return html`
						<div className="tabs">
							${results.map((result) => {
								return html`
									<div data-group=${result.id}>
										<span class="title">${result.title}</span>
										<span class="total">${result.total}</span>
										<span class="active">${result.active ? "yes" : "no"}</span>
									</div>
								`;
							})}
						</div>

						${props.children}
					`;
				},
			},
		});

		Object.assign(window, { ui });

		ui.open();
	});

	await page.locator(".findkit--header").waitFor({ state: "visible" });

	const groupA = page.locator("[data-group='group-a']");
	const groupB = page.locator("[data-group='group-b']");

	await expect(groupA.locator(".title")).toHaveText("GroupA");
	await expect(groupB.locator(".title")).toHaveText("GroupB");

	await expect(groupA.locator(".total")).toHaveText("0");
	await expect(groupB.locator(".total")).toHaveText("0");

	await expect(groupA.locator(".active")).toHaveText("yes");
	await expect(groupB.locator(".active")).toHaveText("yes");

	await page.locator("input").fill("a");

	await expect(groupA.locator(".total")).not.toHaveText("0");
	await expect(groupB.locator(".total")).not.toHaveText("0");

	await page.locator(".findkit--single-group-link").first().click();

	await expect(groupA.locator(".active")).toHaveText("yes");
	await expect(groupB.locator(".active")).toHaveText("no");

	await expect(groupA.locator(".total")).not.toHaveText("0");
	await expect(groupB.locator(".total")).toHaveText("0");
});
