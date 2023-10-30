import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can use preact import", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, preact, html } = MOD;

		const { useState } = preact;

		function Counter() {
			const [count, setCount] = useState(0);

			return html`<button class="counter" onClick=${() => setCount(count + 1)}>
				${count}
			</button>`;
		}

		const ui = new FindkitUI({
			publicToken: "po8GK3G0r",
			slots: {
				Header(props) {
					return html`
						${props.children}
						<${Counter} />
					`;
				},
			},
		});

		ui.open();
	});

	const counter = page.locator(".counter");
	await expect(counter.first()).toBeVisible();

	await counter.click();
	await counter.click();

	await expect(counter.first()).toHaveText("2");
});

test("can use Header slot with 'modal: false'", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const container = document.createElement("div");
		document.body.append(container);

		new FindkitUI({
			publicToken: "po8GK3G0r",
			modal: false,
			container,
			slots: {
				Header() {
					return html`<div class="header-slot">Works</div> `;
				},
			},
		});
	});

	const headerSlot = page.locator(".header-slot");
	await expect(headerSlot).toBeVisible();
});

test("can use Content slot with 'modal: false'", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;

		const container = document.createElement("div");
		document.body.append(container);

		new FindkitUI({
			publicToken: "po8GK3G0r",
			modal: false,
			container,
			slots: {
				Content() {
					return html`<div class="content-slot">Works</div> `;
				},
			},
		});
	});

	const slot = page.locator(".content-slot");
	await expect(slot).toBeVisible();
});

test("can use useTotalHitCount() in Content slot", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html, useTotalHitCount } = MOD;

		const container = document.createElement("div");
		document.body.append(container);

		new FindkitUI({
			publicToken: "po8GK3G0r",
			modal: false,
			container,
			slots: {
				Content(props) {
					const count = useTotalHitCount();
					return html`<div>
						<div class="count">${count}</div>
						<div>${props.children}</div>
					</div>`;
				},
			},
		});
	});

	const count = page.locator(".count");
	await expect(count).toBeVisible();
	expect(await count.innerText()).toEqual("0");

	await page.locator("input").fill("test");

	await expect
		.poll(async () => {
			return count.evaluate((el) => Number(el.textContent) || 0);
		})
		.toBeGreaterThan(0);
});
