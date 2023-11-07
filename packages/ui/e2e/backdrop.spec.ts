import { test, expect } from "@playwright/test";
import { staticEntry } from "../e2e/helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can close modal by clicking back the backdrop", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "po8GK3G0r",
			css: MOD.css`
				.findkit--modal {
					position: fixed;
					width: initial;
					height: initial;
					inset: 20px;
				}
			`,
		});

		ui.open();
	});
	await page.locator(".findkit--modal").waitFor({ state: "visible" });

	// non-backdrop click does not close the modal
	await page.locator(".findkit--header").click();

	// wait for animation
	await page.waitForTimeout(400);

	// Modal is still visible
	await expect(page.locator(".findkit--modal")).toBeInViewport();

	// Click the backdrop
	await page.mouse.click(1, 1);

	await expect(page.locator(".findkit--modal")).toBeHidden();
});
