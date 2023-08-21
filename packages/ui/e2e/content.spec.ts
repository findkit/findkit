import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can use content field", async ({ page }) => {
	// TODO remove __findkit_version=n
	await page.goto(staticEntry("/dummy") + "#__findkit_version=n");

	await page.evaluate(async () => {
		const html = MOD.html;
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			params: {
				content: true,
			},
			slots: {
				Hit(props) {
					return html` <div>${props.hit.content}</div>`;
				},
			},
		});

		Object.assign(window, { ui });

		ui.open("valu");
	});

	const hits = page.locator(".findkit--hit");

	await hits.first().waitFor({ state: "visible" });
	const text = await hits.first().innerText();
	expect(text.length).toBeGreaterThanOrEqual(100);
});
