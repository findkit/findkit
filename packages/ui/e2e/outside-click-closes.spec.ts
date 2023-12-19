import { expect, test } from "@playwright/test";
import { delayer, staticEntry } from "./helpers";

test("can use closeOnOutsideClick", async ({ page }) => {
	const delay = delayer();

	// Prevent findkit js from loading so we can inject test js before it
	await page.route(
		(url) => url.pathname.endsWith("index.js"),
		(route) => {
			delay.what(() => {
				void route.continue();
			});
		},
	);

	await page.goto(staticEntry("/resize-observer"), {
		waitUntil: "commit",
	});

	await page.evaluate(async () => {
		window.addEventListener("findkituievent", (e) => {
			if (e.detail.eventName !== "init") {
				return;
			}

			e.detail.data.options.closeOnOutsideClick = true;
		});
	});

	// Allow findkit js to load once our test js has been injected
	delay.now();

	await page.waitForLoadState("load");

	const input = page.locator("#external-input");

	await input.fill("test");
	const container = page.locator(".findkit--container").first();
	await container.waitFor({ state: "visible" });

	// Not inside the modal but in the focus trap
	await input.click();

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
