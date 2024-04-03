import { test, expect } from "@playwright/test";
import { fixFirefoxTab, pressTab, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

fixFirefoxTab();

test("can use external input with modal", async ({ page }) => {
	await page.goto(staticEntry("/external-input"));

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit a");
	const randomButton = page.locator("text=Random button");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();
	await expect(input).toBeFocused();

	await pressTab(page);

	// Jumps over the random button to the first hit
	await expect(hits.first()).toBeFocused();

	// Escape closes the modal and returns focus to the input
	await page.keyboard.press("Escape");
	await expect(input).toBeFocused();
	await expect(hits.first()).not.toBeVisible();

	await pressTab(page);
	// Random button is can be focused when the modal is closed
	await expect(randomButton).toBeFocused();

	// Enter press in the input opens the modal
	await input.focus();
	await page.keyboard.press("Enter");
	await expect(hits.first()).toBeVisible();
});

test("can lazily bind input", async ({ page, browserName }) => {
	const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
	await page.goto(staticEntry("/external-input-dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html, css } = MOD;

		const ui = new FindkitUI({
			publicToken: "po8GK3G0r",
			trap: false,
			inert: "#random",
			params: {
				tagQuery: [["domain/valu.fi"]],
			},
			slots: {
				Layout(props) {
					return html`${props.content}`;
				},
			},
			css: css`
				.findkit--modal-container {
					top: 50px;
				}
			`,
		});

		ui.open();
		await new Promise((resolve) => setTimeout(resolve, 1000));
		void ui.bindInput("#external-input"!);
	});

	const input = page.locator("#external-input");
	const hits = page.locator(".findkit--hit a");

	await input.fill("valu");
	await expect(hits.first()).toBeVisible();
	await expect(input).toBeFocused();

	await page.keyboard.press(tab);
	// Jumps over the random button to the first hit
	await expect(hits.first()).toBeFocused();
});

test("external input gets focus on load if the url contains search terms", async ({
	page,
}) => {
	await page.goto(staticEntry("/external-input?fdk.q=test"));
	const input = page.locator("#external-input");
	await expect(input).toBeFocused();
	await expect(input).toHaveValue("test");
});
