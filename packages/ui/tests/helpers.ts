import { Page } from "@playwright/test";

export async function getHitHosts(page: Page) {
	const hits = page.locator(".findkit--hit a");
	await hits.first().waitFor({ state: "visible" });

	const hrefs = await hits.evaluateAll((list) => {
		return list.flatMap((el) => {
			if (el instanceof HTMLAnchorElement) {
				return el.href;
			}
			return [];
		});
	});

	const hosts = new Set(hrefs.map((url) => new URL(url).hostname));
	return Array.from(hosts);
}
