import { expect, test } from "@playwright/test";
import { gotoWithEarlyHook, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can use closeOnOutsideClick", async ({ page }) => {
	await gotoWithEarlyHook(page, "/resize-observer", async () => {
		await page.evaluate(async () => {
			window.addEventListener("findkituievent", (e) => {
				if (e.detail.eventName !== "init") {
					return;
				}

				e.detail.data.options.closeOnOutsideClick = true;
			});
		});
	});

	const input = page.locator("#external-input");

	await input.fill("test");
	const container = page.locator(".findkit--container").first();
	await container.waitFor({ state: "visible" });

	// Not inside the modal but in the focus trap
	await input.click();
	await page.waitForTimeout(220);
	await expect(container).toBeVisible();

	// The modal container. Should not cause close
	await container.click();
	await page.waitForTimeout(220);
	await expect(container).toBeVisible();

	// Element not inside the modal
	const text = page.locator("header p");
	await text.click();

	await expect(container).not.toBeVisible();
});

test("closeOnOutsideClick can be disabled (and is by default)", async ({
	page,
}) => {
	await page.goto(staticEntry("/resize-observer"));

	const input = page.locator("#external-input");

	await input.fill("test");
	const container = page.locator(".findkit--container").first();
	await container.waitFor({ state: "visible" });

	// The modal container. Should not cause close
	await container.click();

	await page.waitForTimeout(220);
	await expect(container).toBeVisible();

	// Element not inside the modal
	const text = page.locator("header p");
	await text.click();

	await page.waitForTimeout(220);

	await expect(container).toBeVisible();
});

test("closeOnOutsideClick works with open from toggle with inner element", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		document.body.innerHTML = `
			<button id="toggle"><span>Toggle</span></button>
			<p>Just some text</p>
		`;

		const { FindkitUI, css } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			closeOnOutsideClick: true,
			inert: false,
			css: css`
				.findkit--container {
					top: 2rem;
				}
			`,
		});

		ui.openFrom("#toggle");
	});

	const button = page.locator("#toggle span");
	const container = page.locator(".findkit--container").first();

	await button.click();
	await page.waitForTimeout(320);
	await expect(container).toBeVisible();

	await button.click();
	await page.waitForTimeout(320);
	await expect(container).not.toBeVisible();
});
