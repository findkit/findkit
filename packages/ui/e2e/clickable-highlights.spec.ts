import { Page, expect, test } from "@playwright/test";
import { mockSearchResponses, staticEntry } from "./helpers";
import { assertNonNullable } from "../src/utils";

async function getHitWithHighlight(page: Page, higlight: string) {
	await page.goto(staticEntry("/two-groups-v2"));
	await mockSearchResponses(page, {
		customizeResponse(res) {
			const hit = res.groups[0]!.hits[0]!;

			hit.title = "Test";
			hit.highlight = higlight;

			return res;
		},
	});

	await page.locator("button", { hasText: "open" }).click();
	await page.locator("input").fill("test");

	const hit = page.locator(".findkit--hit").first();
	await hit.waitFor({ state: "visible" });
	return hit;
}

test("highlights have scroll links", async ({ page }) => {
	const hit = await getHitWithHighlight(
		page,
		"Hello <em>world</em>! Another word. Second <em>highlight</em>. The end.",
	);

	const highlightLink = hit.locator(".findkit--highlight a").first();

	await expect(highlightLink).toHaveAttribute(
		"title",
		'Highlight page content around "Hello world! Another"',
	);

	await expect(highlightLink).toHaveAttribute(
		"aria-label",
		'Highlight page content around "Hello world! Another"',
	);

	await expect(highlightLink).toHaveAttribute("tabindex", "-1");

	const href = await highlightLink.getAttribute("href");
	assertNonNullable(href, "has href");
	const url = new URL(href);

	expect(url.hash).toBe(
		`#:~:text=${encodeURIComponent("Hello world! Another")}`,
	);

	const secondHighlightLink = hit.locator(".findkit--highlight a").nth(1);
	await expect(secondHighlightLink).toHaveAttribute(
		"title",
		'Highlight page content around "Second highlight. The"',
	);
});

test("first word highlight", async ({ page }) => {
	const hit = await getHitWithHighlight(
		page,
		"<em>First</em> word. Nisi adipisicing aliquip et incididunt.",
	);

	const highlightLink = hit.locator(".findkit--highlight a").first();

	await expect(highlightLink).toHaveAttribute(
		"title",
		'Highlight page content around "First word."',
	);

	const href = await highlightLink.getAttribute("href");
	assertNonNullable(href, "has href");
	const url = new URL(href);

	expect(url.hash).toBe(`#:~:text=${encodeURIComponent("First word.")}`);
});

test("last word highlight", async ({ page }) => {
	const hit = await getHitWithHighlight(
		page,
		"Hello world. This the <em>last</em>",
	);

	const highlightLink = hit.locator(".findkit--highlight a").first();

	await expect(highlightLink).toHaveAttribute(
		"title",
		'Highlight page content around "the last"',
	);

	const href = await highlightLink.getAttribute("href");
	assertNonNullable(href, "has href");
	const url = new URL(href);

	expect(url.hash).toBe(`#:~:text=${encodeURIComponent("the last")}`);
});

test("can handle special characters joined into to the highlight", async ({
	page,
}) => {
	const hit = await getHitWithHighlight(
		page,
		"Event Object Interface params​ Emitted when the .params changes from a .<em>updateParams</em>() call. Event Object Interface groups​ Emitted when the .groups changes from a .updateGroups() call.",
	);
	const highlightLink = hit.locator(".findkit--highlight a").first();

	await expect(highlightLink).toHaveAttribute(
		"title",
		'Highlight page content around "a .updateParams() call."',
	);

	const href = await highlightLink.getAttribute("href");
	assertNonNullable(href, "has href");
	const url = new URL(href);

	expect(url.hash).toBe(
		`#:~:text=${encodeURIComponent("a .updateParams() call.")}`,
	);
});

test("subsequent highlights", async ({ page }) => {
	const hit = await getHitWithHighlight(
		page,
		"ding <em>foo</em> <em>bar</em> dong",
	);
	const highlightLink = hit.locator(".findkit--highlight a").first();

	const title = await highlightLink.getAttribute("title");
	expect(title).toEqual('Highlight page content around "ding foo bar"');
});

test("subsequent highlights searated by special character (trailing)", async ({
	page,
}) => {
	const hit = await getHitWithHighlight(
		page,
		"ding <em>foo</em>.<em>bar</em> dong",
	);
	const highlightLink = hit.locator(".findkit--highlight a").first();

	const title = await highlightLink.getAttribute("title");
	expect(title).toEqual('Highlight page content around "ding foo.bar dong"');
});

test("subsequent highlights searated by special character (leading)", async ({
	page,
}) => {
	const hit = await getHitWithHighlight(
		page,
		"ding <em>foo</em>.<em>bar</em> dong",
	);
	const highlightLink = hit.locator(".findkit--highlight a").nth(1);

	const title = await highlightLink.getAttribute("title");
	expect(title).toEqual('Highlight page content around "ding foo.bar dong"');
});
