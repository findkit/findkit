import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can use Group slot", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 0,
			groups: [
				{
					id: "first",
					title: "First",
					previewSize: 2,
				},
				{
					id: "second",
					title: "Second",
					previewSize: 2,
				},
			],
			slots: {
				Group(props) {
					if (props.id === "second") {
						// prettier-ignore
						return html`
							<h2>Custom group slot</h2>
							<${props.parts.Hits} ...${props} />
						`;
					}

					return html`${props.children}`;
				},
			},
		});

		ui.open();
	});

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });

	const secondGroup = page.locator(".findkit--group").last();

	await expect(secondGroup.locator("h2")).toHaveText("Custom group slot");
	await expect(secondGroup.locator(".findkit--hit").first()).toBeVisible();
});
