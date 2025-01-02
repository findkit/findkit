import { expect, test } from "@playwright/test";
import { staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("can customize footer elements", async ({ page }) => {
	await page.goto(staticEntry("/dummy"));

	await page.evaluate(async () => {
		const { FindkitUI, html } = MOD;
		const ui = new FindkitUI({
			publicToken: "pW1D0p0Dg",
			minTerms: 1,
			infiniteScroll: false,
			fetchCount: 4,
			slots: {
				Results(props) {
					return html`
						<${props.parts.BackLink} />
						<${props.parts.Title} />
						<${props.parts.Hits} />
						<${props.parts.Footer}
							loadMore=${html`<i>Custom More</i>`}
							allResultsShown=${html`<i>Custom all results shown</i>`}
							noResults=${html`<i>Custom no results</i>`}
						/>
					`;
				},
			},
		});

		ui.open();
	});

	const input = page.locator("input");

	await input.fill("a");

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });

	await page.mouse.wheel(0, 300);

	const footer = page.locator(".findkit--footer");

	await expect(page.locator(".findkit--load-more-button")).toHaveText(
		"Custom More",
	);

	await input.fill("running shoes");

	await expect.poll(async () => footer.innerText()).not.toBe("Custom More");

	await expect(page.locator(".findkit--all-results-shown")).toHaveText(
		"Custom all results shown",
	);

	await input.fill("do not find anything with this");

	await expect
		.poll(async () => footer.innerText())
		.not.toBe("Custom all results shown");

	await expect(page.locator(".findkit--all-results-shown")).toHaveText(
		"Custom all results shown",
	);
});
