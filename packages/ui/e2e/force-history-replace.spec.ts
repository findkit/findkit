import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("other navigation history state is preseverd when using forceHistoryReplace", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		history.replaceState({ my: "test" }, "", location.href);
	});

	await page.evaluate(async () => {});

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 0,
			forceHistoryReplace: true,
		});
		ui.open();
	});

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });

	await page.mouse.wheel(0, 200);
	// Wait for the scroll throttle save to kick in
	await page.waitForTimeout(500);

	// Other history is not affected
	expect(
		await page.evaluate(async () => {
			return history.state;
		}),
	).toMatchObject({
		my: "test",
		findkitScrollTop: 200,
		findkitRestoreId: expect.any(String),
	});
});
