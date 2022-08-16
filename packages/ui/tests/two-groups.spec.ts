import { test, expect } from "@playwright/test";

test("can navigate to full group results and back", async ({ page }) => {
    await page.goto("http://localhost:28104/two-groups");
    const hits = page.locator(".findkit--hit");
    const groupTitles = page.locator(".findkit--group-title");
    const loading = page.locator(".findkit--loading");

    await page.locator("text=open").click();
    await page.locator("input:visible").type("mikko");

    expect(await groupTitles.count()).toBe(2);
    await hits.first().waitFor({ state: "visible" });

    const hitCount1 = await hits.count();
    expect(hitCount1).toBeGreaterThan(2);

    await page.locator(".findkit--more-link").first().click();

    await loading.waitFor({ state: "hidden" });

    const hitCount2 = await hits.count();
    expect(hitCount2).toBeGreaterThan(hitCount1);

    expect(await groupTitles.count()).toBe(1);

    await page.locator(".findkit--load-more-button").first().click();

    await loading.waitFor({ state: "hidden" });

    const hitCount3 = await hits.count();
    expect(hitCount3).toBeGreaterThan(hitCount2);

    await page.locator(".findkit--back-link").first().click();

    await loading.waitFor({ state: "hidden" });

    const hitCount4 = await hits.count();
    expect(hitCount4).toBeLessThan(hitCount3);
});

test("refresh restores search results", async ({ page }) => {
    await page.goto("http://localhost:28104/two-groups");
    const hits = page.locator(".findkit--hit");

    await page.locator("text=open").click();
    await page.locator("input:visible").type("mikko");
    await hits.first().waitFor({ state: "visible" });

    await page.reload();

    await hits.first().waitFor({ state: "visible" });

    const hitCount1 = await hits.count();
    expect(hitCount1).toBeGreaterThan(2);
});

test("can navigate directly to a group results", async ({ page }) => {
    await page.goto(
        "http://localhost:28104/two-groups?fdk_q=mikko&fdk_id=valu",
    );
    const hits = page.locator(".findkit--hit");
    await hits.first().waitFor({ state: "visible" });

    const hitCount1 = await hits.count();
    expect(hitCount1).toBeGreaterThan(2);
    const groupTitles = page.locator(".findkit--group-title");
    expect(await groupTitles.count()).toBe(1);
});

test("back button works", async ({ page }) => {
    await page.goto("http://localhost:28104/two-groups");
    const hits = page.locator(".findkit--hit");
    const groupTitles = page.locator(".findkit--group-title");
    const loading = page.locator(".findkit--loading");

    await page.locator("text=open").click();
    await page.locator("input:visible").type("mikko");

    expect(await groupTitles.count()).toBe(2);
    await hits.first().waitFor({ state: "visible" });

    const moreLink = page.locator(".findkit--more-link");

    await moreLink.first().click();

    await loading.waitFor({ state: "hidden" });

    expect(await groupTitles.count()).toBe(1);

    await page.goBack();
    await moreLink.first().waitFor({ state: "visible" });

    expect(await groupTitles.count()).toBe(2);

    await page.goBack();

    await groupTitles.first().waitFor({ state: "hidden" });
});

test("forward button restores search terms", async ({ page }) => {
    await page.goto("http://localhost:28104/two-groups");
    const hits = page.locator(".findkit--hit");
    const input = page.locator("input:visible");

    await page.locator("text=open").click();
    await input.type("mikko");

    await hits.first().waitFor({ state: "visible" });

    await page.goBack();

    await hits.first().waitFor({ state: "hidden" });

    await page.goForward();

    await hits.first().waitFor({ state: "visible" });
});

test("escape closes the modal", async ({ page }) => {
    await page.goto("http://localhost:28104/two-groups");
    const hits = page.locator(".findkit--hit");
    const input = page.locator("input:visible");

    await page.locator("text=open").click();
    await input.type("mikko");

    await hits.first().waitFor({ state: "visible" });

    await page.keyboard.press("Escape");

    await hits.first().waitFor({ state: "hidden" });
});
