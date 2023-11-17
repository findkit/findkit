import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can make transient search params updates with transientUpdateParams", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			slots: {
				Hit(props) {
					return props.hit.customFields.price?.value;
				},
			},
			params: {
				sort: {
					price: {
						$order: "asc" as "asc" | "desc",
					},
				},
			},
		});

		const testEvents: any[] = [];
		Object.assign(window, { testEvents, ui });

		ui.on("fetch", (e) => {
			testEvents.push("fetch");

			if (e.terms === "boots") {
				e.transientUpdateParams({
					sort: {
						price: {
							$order: "desc",
						},
					},
				});
			}
		});

		ui.open();
	});

	const input = page.locator("input");
	await input.fill("boots");

	await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

	const testEvents = await page.evaluate(async () => {
		return (window as any).testEvents as any[];
	});

	const hits = page.locator(".findkit--hit");

	expect(testEvents).toEqual(["fetch"]);
	expect(await hits.allInnerTexts()).toEqual(["220", "100", "30"]);

	await input.fill("comp");
	await expect
		.poll(() => hits.allInnerTexts())
		.toEqual(["20", "20", "30", "30", "30", "250"]);
});

test("can persist changes made in the 'fetch' with ui.updateParams()", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
			slots: {
				Hit(props) {
					return props.hit.customFields.price?.value;
				},
			},
			params: {
				sort: {
					price: {
						$order: "asc" as "asc" | "desc",
					},
				},
			},
		});

		Object.assign(window, { ui });

		ui.on("fetch", (e) => {
			if (e.terms === "boots") {
				ui.updateParams({
					sort: {
						price: {
							$order: "desc",
						},
					},
				});
			}
		});

		ui.open();
	});

	const input = page.locator("input");
	await input.fill("boots");

	await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

	const hits = page.locator(".findkit--hit");

	expect(await hits.allInnerTexts()).toEqual(["220", "100", "30"]);

	await input.fill("comp");
	await expect
		.poll(() => hits.allInnerTexts())
		.toEqual(["250", "30", "30", "30", "20", "20"]);
});

test("can transparently modify terms in the fetch event", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const ui = new MOD.FindkitUI({
			publicToken: "pW1D0p0Dg",
		});

		const testEvents: any[] = [];
		Object.assign(window, { testEvents, ui });

		ui.on("fetch", (e) => {
			testEvents.push("fetch");
			e.terms = "diamond";
		});

		ui.open();
	});

	const input = page.locator("input");
	await input.fill("boots");

	await page.locator(".findkit--hit").first().waitFor({ state: "visible" });

	const testEvents = await page.evaluate(async () => {
		return (window as any).testEvents as any[];
	});

	expect(testEvents).toEqual(["fetch"]);
	const hit = page.locator(".findkit--hit").first();
	await expect(hit).toContainText("Diamond");

	// Terms update should not update the terms user typed
	expect(await input.inputValue()).toEqual("boots");
});
