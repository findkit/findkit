import { expect, test } from "@playwright/test";
import { mockSearchResponses, routeMocks, staticEntry } from "./helpers";
declare const MOD: typeof import("../src/cdn-entries/index");
declare const ui: InstanceType<typeof MOD.FindkitUI>;

test("emits hit-click events and can prevent default", async ({ page }) => {
	await mockSearchResponses(page);
	await page.goto(staticEntry("/single-group"));
	const hits = page.locator(".findkit--hit a");
	const button = page.locator("button", { hasText: "open" });
	await button.click();

	const clickPromise = page.evaluate(async () => {
		return await new Promise<any>((resolve) => {
			ui.on("hit-click", (e) => {
				e.preventDefault();
				resolve({
					url: e.hit.url,
					terms: e.terms,
				});
			});
		});
	});

	const input = page.locator('[aria-label="Search input"]');
	await input.fill("wordpress");
	const hitUrl = await hits.first().getAttribute("href");
	await hits.first().click();

	expect(page.url()).toContain("single-group");

	const click = await clickPromise;
	expect(click.url).toEqual(hitUrl);
});

test("hit-click is emitted for highlight links", async ({ page }) => {
	await mockSearchResponses(page);
	await routeMocks(page);
	await page.goto(staticEntry("/dummy"));

	let alertMessage = "";
	page.on("dialog", (dialog) => {
		alertMessage = dialog.message();
		return dialog.accept();
	});

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "test",
		});

		ui.on("hit-click", (e) => {
			alert(e.hit.url);
		});

		ui.open("text");
	});

	const emLink = page.locator("a.findkit--em").first();
	const href = await emLink.getAttribute("href");
	const url = new URL(href!);
	url.hash = "";

	await emLink.click();

	await expect.poll(() => alertMessage).toEqual(url.toString());
});

test("hit-click is emitted for custom links pointing to the hit url", async ({
	page,
}) => {
	await mockSearchResponses(page);
	await routeMocks(page);
	await page.goto(staticEntry("/dummy"));

	let alertMessage = "";
	page.on("dialog", (dialog) => {
		alertMessage = dialog.message();
		return dialog.accept();
	});

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "test",
			slots: {
				Hit(props) {
					return html`
						<a class="custom" href="${props.hit.url}">Custom Link</a>
					`;
				},
			},
		});

		ui.on("hit-click", (e) => {
			alert(e.hit.url);
		});

		ui.open("text");
	});

	const link = page.locator("a.custom").first();
	const href = await link.getAttribute("href");

	const url = new URL(href!);
	url.hash = "";

	await link.click();

	await expect.poll(() => alertMessage).toEqual(url.toString());
});

test("hit-click is not emitted for custom links pointing pointing to somewhere else", async ({
	page,
}) => {
	await mockSearchResponses(page);
	await routeMocks(page);
	await page.goto(staticEntry("/dummy"));

	let gotAlert = false;
	page.on("dialog", (dialog) => {
		gotAlert = true;
		return dialog.accept();
	});

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "test",
			slots: {
				Hit() {
					return html`
						<a class="custom" href="http://shop.findkit.invalid/other"
							>Custom Link</a
						>
					`;
				},
			},
		});

		ui.on("hit-click", (e) => {
			alert(e.hit.url);
		});

		ui.open("text");
	});

	await page.locator("a.custom").first().click();

	await page.waitForLoadState("domcontentloaded");

	expect(gotAlert).toBe(false);
});
