import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can set input placeholder", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
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
				Header(props) {
					console.log("props", props);
					return html`
						<${props.parts.CloseButton} />
						<${props.parts.Input} placeholder="Custom placeholder" />
					`;
				},
			},
		});

		ui.open();
	});

	const header = page.locator(".findkit--header").first();
	await header.waitFor({ state: "visible" });

	await expect(header.locator("input")).toHaveAttribute(
		"placeholder",
		"Custom placeholder",
	);
});
