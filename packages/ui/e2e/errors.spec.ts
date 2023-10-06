import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("fetch error and retry", async ({ page }) => {
	let abortOnce = true;

	await page.route(
		(url) => url.hostname.endsWith(".findkit.com"),
		(route) => {
			if (abortOnce) {
				abortOnce = false;
				void route.abort();
			} else {
				void route.continue();
			}
		},
	);

	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({ publicToken: "pW1D0p0Dg" });

		ui.open("diamond");
	});

	const error = page.locator(".findkit--error");
	await expect(error).toContainText("Fetch errored");

	const retryButton = page.locator("text=Try again");
	await retryButton.click();

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	await expect(error).not.toBeVisible();
});

test("hit error boundary", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			slots: {
				Hit(props) {
					if (props.hit.title.includes("Console")) {
						throw new Error("Test error");
					}

					return props.children;
				},
			},
		});

		ui.open("gaming");
	});

	const error = page.locator(".findkit--error");
	await expect(error).toContainText('Error rendering slot "Hit"');
	await expect(error).toContainText("Gaming Console");
	await expect(error).toContainText(
		"https://shop.findkit.invalid/en/electronics/gaming-console",
	);
	await expect(error).toContainText("Test error");
});

test("Header error boundary", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			slots: {
				Header() {
					throw new Error("Test error");
				},
			},
		});

		ui.open("gaming");
	});

	const hits = page.locator(".findkit--hit");
	await hits.first().waitFor({ state: "visible" });

	const error = page.locator(".findkit--error");
	await expect(error).toContainText('Error rendering slot "Header"');
	await expect(error).toContainText("Test error");
});

test("Content error boundary", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			slots: {
				Content() {
					throw new Error("Test error");
				},
			},
		});

		ui.open("gaming");
	});

	const error = page.locator(".findkit--error");
	await expect(error).toContainText('Error rendering slot "Content"');
	await expect(error).toContainText("Test error");

	const hits = page.locator(".findkit--hit");
	await expect(hits.first()).not.toBeVisible();
});
