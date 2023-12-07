import { test, expect } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can modify FindkitUI constructor options with a browser event", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		window.addEventListener("findkituievent", (e) => {
			// @ts-expect-error
			e.detail.data.type === "bad";

			// @ts-expect-error
			e.detail.instance.bad;

			if (e.detail.type !== "init") {
				return;
			}

			if (e.detail.instance.id !== "customid") {
				throw new Error("Failed see instance in the event");
			}

			// @ts-expect-error
			e.detail.data.bad;

			const { css, html, useParams } = e.detail.data.utils;
			const { useState } = e.detail.data.preact;

			e.detail.data.options.css = css`
				.modified {
					color: red;
				}
			`;

			e.detail.data.options.slots = {
				Header(props) {
					const [params] = useParams();
					const [state] = useState("preact state");

					return html`
						${props.children}
						<div class="modified">Hello</div>
						<div class="params">${params.filter?.tags}</div>
						<div class="state">${state}</div>
					`;
				},
			};
		});

		window.addEventListener("findkituievent", (e) => {
			if (e.detail.type !== "init") {
				return;
			}

			const ui = e.detail.instance;

			const uiEvents: any[] = [];
			Object.assign(window, { ui, uiEvents });

			ui.on("open", () => {
				uiEvents.push("open");
			});
		});
	});

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			instanceId: "customid",
			publicToken: "noop",
			params: {
				filter: {
					tags: "ding",
				},
			},
		});
		ui.open();
	});

	const header = page.locator(".findkit--header");
	await header.waitFor({ state: "visible" });

	const modified = page.locator(".modified");

	await expect(modified).toBeVisible();
	await expect(modified).toHaveCSS("color", "rgb(255, 0, 0)");

	await expect(page.locator(".params")).toHaveText("ding");
	await expect(page.locator(".state")).toHaveText("preact state");

	const events = await page.evaluate(() => {
		return (window as any).uiEvents;
	});

	expect(events).toEqual(["open"]);
});
