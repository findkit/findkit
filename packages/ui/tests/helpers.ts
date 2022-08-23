import { Page } from "@playwright/test";
import type { FindkitUI } from "../src/cdn-entries";
import type { FindkitUIEvents } from "../src/emitter";

declare const ui: FindkitUI;

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

/**
 * Awaits for an event to be emitted by the Findkit UI and returns the event.
 */
export async function oneEvent<EventName extends keyof FindkitUIEvents>(
	page: Page,
	eventName: EventName
): Promise<FindkitUIEvents[EventName]> {
	return await page.evaluate(async (eventName) => {
		return await new Promise<any>((resolve) => {
			const off = ui.events.on(eventName, (e) => {
				off();
				resolve(e);
			});
		});
	}, eventName);
}
