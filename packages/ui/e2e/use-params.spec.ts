import { test, expect } from "@playwright/test";
import { getHitHosts, spinnerLocator, staticEntry } from "./helpers";

test("can use 'useParams()' to filter results", async ({ page }) => {
	await page.goto(staticEntry("/use-params"));
	const loading = spinnerLocator(page);
	await page.locator("text=open").click();

	const hits = page.locator(".findkit--hit a");
	const input = page.locator('[aria-label="Search input"]');
	const statementButton = page.locator("button", { hasText: "Statement.fi" });
	const valufiButton = page.locator("button", { hasText: "Valu.fi" });

	await input.type("valu");
	await hits.first().waitFor({ state: "visible" });

	await expect(valufiButton).toBeDisabled();
	await expect(statementButton).not.toBeDisabled();

	expect(await getHitHosts(page)).toEqual(["www.valu.fi"]);

	await statementButton.click();
	await loading.waitFor({ state: "hidden" });

	expect(await getHitHosts(page)).toEqual(["statement.fi"]);

	await expect(valufiButton).not.toBeDisabled();
	await expect(statementButton).toBeDisabled();
});
