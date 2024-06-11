import { expect, test } from "@playwright/test";
import { mockSearchResponses, staticEntry } from "./helpers";

declare const MOD: typeof import("../src/cdn-entries/index");

test("ordering is correct when the same hit is returned with different score in subsequent searches", async ({
	page,
}) => {
	await page.goto(staticEntry("/dummy"));

	let i = 0;
	await mockSearchResponses(page, {
		customizeResponse() {
			i++;

			if (i === 1) {
				return RES1;
			} else if (i === 2) {
				return RES2;
			} else {
				throw new Error("Unexpected request");
			}
		},
	});

	await page.evaluate(async () => {
		const { FindkitUI } = MOD;
		const ui = new FindkitUI({
			publicToken: "test",
			minTerms: 1,
			params: {
				operator: "or",
			},
		});
		(window as any).ui = ui;
		ui.open();
	});

	const input = page.locator("input");
	await input.fill("la p");

	const hit = page.locator(".findkit--hit");
	await hit.first().waitFor({ state: "visible" });

	const wait = page.waitForResponse((response) => {
		return (
			response.url().includes("search.findkit.com") &&
			response.request().method() === "POST"
		);
	});

	await input.fill("la pi");

	await wait;
	await page.waitForTimeout(100);

	const ariaLabels = await hit.evaluateAll((elements) =>
		elements.map((element) => element.getAttribute("aria-label")),
	);

	expect(ariaLabels).toEqual([
		"Search result 1",
		"Search result 2",
		"Search result 3",
		"Search result 4",
		"Search result 5",
		"Search result 6",
		"Search result 7",
		"Search result 8",
		"Search result 9",
		"Search result 10",
		"Search result 11",
	]);
});

const RES1 = {
	groups: [
		{
			total: 93,
			duration: 14,
			hits: [
				{
					score: 8,
					superwordsMatch: false,
					title: "Unikko pussilakanasetti",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/tekstiilit/unikko-pussilakanasetti",
					highlight:
						"Unikon kuvioinen <em>pussilakanasetti</em> tuo iloa ja väriä makuuhuoneeseen. Kaunis kuosi kestää aikaa.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/tekstiilit",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-09-12T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.344Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Tekstiilit",
						},
						weight: {
							type: "number",
							value: 0.8,
						},
						price: {
							type: "number",
							value: 92.5,
						},
						quantity: {
							type: "number",
							value: 17,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Picnic Basket",
					language: "en",
					url: "https://shop.findkit.invalid/en/outdoor/picnic-basket",
					highlight:
						"This <em>picnic</em> basket is spacious, lightweight and easy to carry. Ideal for family outings, <em>picnics</em> or beach trips. Comes with a set of dining utensils.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/outdoor",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-09-30T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.370Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Outdoor",
						},
						weight: {
							type: "number",
							value: 2,
						},
						price: {
							type: "number",
							value: 40,
						},
						quantity: {
							type: "number",
							value: 15,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Parolan Rottinki virkattu kori",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/sisustus/parolan-rottinki-virkattu-kori",
					highlight:
						"Se sopii täydellisesti <em>pienien</em> tavaroiden säilytykseen.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/sisustus",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-06-23T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.408Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Sisustus",
						},
						weight: {
							type: "number",
							value: 0.2,
						},
						price: {
							type: "number",
							value: 38.9,
						},
						quantity: {
							type: "number",
							value: 13,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Wooden Photo Frame",
					language: "en",
					url: "https://shop.findkit.invalid/en/home-decor/wooden-photo-frame",
					highlight:
						"<em>Preserve</em> your <em>precious</em> memories with this attractive wooden <em>photo</em> frame. The frame features a classic design that blends well with any decor.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/home-decor",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-10-15T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.559Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Home Decor",
						},
						weight: {
							type: "number",
							value: 0.3,
						},
						price: {
							type: "number",
							value: 15,
						},
						quantity: {
							type: "number",
							value: 75,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Stainless Steel Pot",
					language: "en",
					url: "https://shop.findkit.invalid/en/kitchenware/stainless-steel-pot",
					highlight:
						"This stainless steel <em>pot</em> is <em>perfect</em> for a variety of cooking needs. It comes with a lid. It heats evenly and is easy to clean.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/kitchenware",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-11-20T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.647Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Kitchenware",
						},
						weight: {
							type: "number",
							value: 1,
						},
						price: {
							type: "number",
							value: 25,
						},
						quantity: {
							type: "number",
							value: 70,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Pentik Seppele doisetti",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/tekstiilit/pentik-seppele-doisetti",
					highlight:
						"Ruokapöydän <em>päässä</em> asetettu <em>pöytäliina</em> luo juhlavan tunnelman. <em>Pentikin</em> tyylikäs <em>pellavalakki</em> on kaunis ja käytännöllinen.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/tekstiilit",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-08-27T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.733Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Tekstiilit",
						},
						weight: {
							type: "number",
							value: 0.3,
						},
						price: {
							type: "number",
							value: 34.9,
						},
						quantity: {
							type: "number",
							value: 32,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Perfume",
					language: "en",
					url: "https://shop.findkit.invalid/en/beauty/perfume",
					highlight:
						"This elegant <em>perfume</em> has a captivating scent that is sure to make you stand out. It&#x27;s <em>perfect</em> for everyday wear or special occasions.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/beauty",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-11-01T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.745Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Beauty",
						},
						weight: {
							type: "number",
							value: 0.3,
						},
						price: {
							type: "number",
							value: 60,
						},
						quantity: {
							type: "number",
							value: 40,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Pet Carrier",
					language: "en",
					url: "https://shop.findkit.invalid/en/pet-accessories/pet-carrier",
					highlight:
						"This <em>pet</em> carrier is <em>perfect</em> for traveling with small to medium-sized <em>pets</em>. It&#x27;s sturdy, lightweight, and ventilated to keep <em>pets</em> comfortable.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/pet-accessories",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-11-12T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.847Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Pet Accessories",
						},
						weight: {
							type: "number",
							value: 2,
						},
						price: {
							type: "number",
							value: 40,
						},
						quantity: {
							type: "number",
							value: 35,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Finlayson Elefantti pyyheliina",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/tekstiilit/finlayson-elefantti-pyyheliina",
					highlight:
						"Värikäs <em>pyyheliina</em> tekee kylpyhuoneesta iloisen.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/tekstiilit",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-08-10T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.905Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Tekstiilit",
						},
						weight: {
							type: "number",
							value: 0.3,
						},
						price: {
							type: "number",
							value: 14.5,
						},
						quantity: {
							type: "number",
							value: 80,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Canvas Art Print",
					language: "en",
					url: "https://shop.findkit.invalid/en/home-decor/canvas-art-print",
					highlight:
						"Add a touch of creativity to your home with this canvas art <em>print</em>. The <em>print</em> features a stunning design and vibrant colors. <em>Perfect</em> wall decor.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/home-decor",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-11-12T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.010Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Home Decor",
						},
						weight: {
							type: "number",
							value: 0.5,
						},
						price: {
							type: "number",
							value: 50,
						},
						quantity: {
							type: "number",
							value: 10,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Aarikka Pässi avaimenperä",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/sisustus/aarikka-passi-avaimenpera",
					highlight: "<em>Pässi</em>-avaimenperä on käytännöllinen ja kestävä.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/sisustus",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-07-10T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.131Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Sisustus",
						},
						weight: {
							type: "number",
							value: 0.05,
						},
						price: {
							type: "number",
							value: 10.2,
						},
						quantity: {
							type: "number",
							value: 70,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Power Drill",
					language: "en",
					url: "https://shop.findkit.invalid/en/tools/power-drill",
					highlight:
						"This <em>power</em> drill is a versatile tool for any home repair or construction <em>project</em>. It&#x27;s <em>powerful</em>, easy to use and comes with a set of drill bits.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/tools",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-09-26T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.263Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Tools",
						},
						weight: {
							type: "number",
							value: 1.5,
						},
						price: {
							type: "number",
							value: 60,
						},
						quantity: {
							type: "number",
							value: 20,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Vapiano pastakattila",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/keittiotarvikkeet/vapiano-pastakattila",
					highlight:
						"Korkealaatuinen kattila on ihanteellinen <em>pastan</em> keittoon. Vapiano-<em>pastakattila</em> on tilava ja kestävä.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/keittiotarvikkeet",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-11-18T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.377Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Keittiötarvikkeet",
						},
						weight: {
							type: "number",
							value: 2.5,
						},
						price: {
							type: "number",
							value: 78,
						},
						quantity: {
							type: "number",
							value: 18,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Marimekko Unikko patalappu",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/keittiotarvikkeet/marimekko-unikko-patalappu",
					highlight:
						"<em>Patalappu</em> suojaa kätesi kuumalta ja on käytännöllinen apu keittiössä. Unikko-<em>patalapussa</em> on kaunis kukkakuviointi.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/keittiotarvikkeet",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-04-10T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.412Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Keittiötarvikkeet",
						},
						weight: {
							type: "number",
							value: 0.1,
						},
						price: {
							type: "number",
							value: 13.5,
						},
						quantity: {
							type: "number",
							value: 150,
						},
					},
				},
				{
					score: 8,
					superwordsMatch: false,
					title: "Jopo polkupyörä",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/harrastukset/jopo-polkupyora",
					highlight:
						"<em>Pyöräily</em> on ympäristöystävällistä ja hauskaa. Jopo-<em>polkupyörä</em> on hauska ja käytännöllinen tapa liikkua kaupungissa.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/harrastukset",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-05-18T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.474Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Harrastukset",
						},
						weight: {
							type: "number",
							value: 15,
						},
						price: {
							type: "number",
							value: 269,
						},
						quantity: {
							type: "number",
							value: 8,
						},
					},
				},
				{
					score: 6,
					superwordsMatch: false,
					title: "Moomin Pilkut muki",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/astiat/moomin-pilkut-muki",
					highlight: "",
					domain: "shop.findkit.invalid",
					tags: [
						"category/astiat",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-09-18T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.378Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Astiat",
						},
						weight: {
							type: "number",
							value: 0.4,
						},
						price: {
							type: "number",
							value: 16,
						},
						quantity: {
							type: "number",
							value: 0,
						},
					},
				},
				{
					score: 6,
					superwordsMatch: false,
					title: "Pentik Saaga Kattausliina",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/tekstiilit/pentik-saaga-kattausliina",
					highlight: "",
					domain: "shop.findkit.invalid",
					tags: [
						"category/tekstiilit",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-09-25T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.683Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Tekstiilit",
						},
						weight: {
							type: "number",
							value: 0.8,
						},
						price: {
							type: "number",
							value: 46,
						},
						quantity: {
							type: "number",
							value: 10,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Gardening Gloves",
					language: "en",
					url: "https://shop.findkit.invalid/en/garden/gardening-gloves",
					highlight:
						"<em>Protect</em> your hands with these sturdy gardening gloves. They&#x27;re comfortable to wear and <em>provide</em> excellent grip. Ideal for all types of gardening tasks.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/garden",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-09-20T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.327Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Garden",
						},
						weight: {
							type: "number",
							value: 0.2,
						},
						price: {
							type: "number",
							value: 10,
						},
						quantity: {
							type: "number",
							value: 100,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Wireless Earbuds Sony",
					language: "en",
					url: "https://shop.findkit.invalid/en/electronics/wireless-earbuds-sony",
					highlight:
						"<em>Perfect</em> for music, calls and entertainment. Features easy touch controls and a comfortable fit for all day use.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/electronics",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-08-10T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.337Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Electronics",
						},
						weight: {
							type: "number",
							value: 0.1,
						},
						price: {
							type: "number",
							value: 70,
						},
						quantity: {
							type: "number",
							value: 50,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Suede Boots",
					language: "en",
					url: "https://shop.findkit.invalid/en/clothing/suede-boots",
					highlight:
						"These suede boots <em>provide</em> both comfort and style. They&#x27;re crafted from high-quality suede and have a durable sole for long-lasting wear.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/clothing",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-10-20T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.350Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Clothing",
						},
						weight: {
							type: "number",
							value: 1,
						},
						price: {
							type: "number",
							value: 100,
						},
						quantity: {
							type: "number",
							value: 0,
						},
					},
				},
			],
		},
	],
	duration: 23,
	messages: [],
};

const RES2 = {
	groups: [
		{
			total: 11,
			duration: 10,
			hits: [
				{
					score: 8,
					superwordsMatch: false,
					title: "Picnic Basket",
					language: "en",
					url: "https://shop.findkit.invalid/en/outdoor/picnic-basket",
					highlight:
						"This <em>picnic</em> basket is spacious, lightweight and easy to carry. Ideal for family outings, <em>picnics</em> or beach trips. Comes with a set of dining utensils.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/outdoor",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-09-30T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.370Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Outdoor",
						},
						weight: {
							type: "number",
							value: 2,
						},
						price: {
							type: "number",
							value: 40,
						},
						quantity: {
							type: "number",
							value: 15,
						},
					},
				},
				{
					score: 6,
					superwordsMatch: false,
					title: "Moomin Pilkut muki",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/astiat/moomin-pilkut-muki",
					highlight: "",
					domain: "shop.findkit.invalid",
					tags: [
						"category/astiat",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-09-18T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.378Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Astiat",
						},
						weight: {
							type: "number",
							value: 0.4,
						},
						price: {
							type: "number",
							value: 16,
						},
						quantity: {
							type: "number",
							value: 0,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Parolan Rottinki virkattu kori",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/sisustus/parolan-rottinki-virkattu-kori",
					highlight:
						"Se sopii täydellisesti <em>pienien</em> tavaroiden säilytykseen.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/sisustus",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-06-23T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.408Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Sisustus",
						},
						weight: {
							type: "number",
							value: 0.2,
						},
						price: {
							type: "number",
							value: 38.9,
						},
						quantity: {
							type: "number",
							value: 13,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Terkku villasukat",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/vaatteet/terkku-villasukat",
					highlight:
						"Lämmin ja mukava villasukka <em>pitää</em> jalkasi lämpiminä talven kylmyyttä vastaan. Terkku-villasukat ovat kauniita ja pehmeitä.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/vaatteet",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-10-05T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.606Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Vaatteet",
						},
						weight: {
							type: "number",
							value: 0.2,
						},
						price: {
							type: "number",
							value: 29,
						},
						quantity: {
							type: "number",
							value: 60,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Ruisleipä",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/ruoka/ruisleipa",
					highlight: "Se antaa energiaa ja <em>pitää</em> nälän loitolla.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/ruoka",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-03-25T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.669Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Ruoka",
						},
						weight: {
							type: "number",
							value: 0.5,
						},
						price: {
							type: "number",
							value: 2.8,
						},
						quantity: {
							type: "number",
							value: 200,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Kastehelmi",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/astiat/kastehelmi",
					highlight:
						"Sen pyöreät <em>pisarat</em> loistavat kuin päiväkaste. Se sopii hyvin joka päivän käyttöön.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/astiat",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-11-29T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.831Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Astiat",
						},
						weight: {
							type: "number",
							value: 0.5,
						},
						price: {
							type: "number",
							value: 19.9,
						},
						quantity: {
							type: "number",
							value: 75,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Cashmere Sweater",
					language: "en",
					url: "https://shop.findkit.invalid/en/clothing/cashmere-sweater",
					highlight: "A timeless <em>piece</em> for any wardrobe.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/clothing",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-10-05T00:00:00.000Z",
					modified: "2023-10-12T15:29:11.914Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Clothing",
						},
						weight: {
							type: "number",
							value: 0.3,
						},
						price: {
							type: "number",
							value: 110,
						},
						quantity: {
							type: "number",
							value: 20,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Silver Necklace",
					language: "en",
					url: "https://shop.findkit.invalid/en/jewelry/silver-necklace",
					highlight:
						"The silver necklace is a timeless <em>piece</em> of jewelry that adds elegance to any outfit. With a delicate design, it is a perfect everyday accessory.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/jewelry",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-10-20T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.014Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Jewelry",
						},
						weight: {
							type: "number",
							value: 0.02,
						},
						price: {
							type: "number",
							value: 130,
						},
						quantity: {
							type: "number",
							value: 20,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Diamond Ring",
					language: "en",
					url: "https://shop.findkit.invalid/en/jewelry/diamond-ring",
					highlight:
						"A stunning <em>piece</em> of jewelry that every woman will love.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/jewelry",
						"language/en",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2022-07-30T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.123Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Jewelry",
						},
						weight: {
							type: "number",
							value: 0.01,
						},
						price: {
							type: "number",
							value: 1000,
						},
						quantity: {
							type: "number",
							value: 5,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Toive lasinalunen",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/keittiotarvikkeet/toive-lasinalunen",
					highlight:
						"Lasinalunen suojaa pöydän <em>pintaa</em> ja on mukava yksityiskohta sisustuksessa. Toive-lasinaluset ovat lämpöä kestäviä ja houkuttelevia.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/keittiotarvikkeet",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-10-10T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.144Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Keittiötarvikkeet",
						},
						weight: {
							type: "number",
							value: 0.02,
						},
						price: {
							type: "number",
							value: 10,
						},
						quantity: {
							type: "number",
							value: 400,
						},
					},
				},
				{
					score: 2,
					superwordsMatch: false,
					title: "Kupla tuikkulyhty",
					language: "fi",
					url: "https://shop.findkit.invalid/fi/sisustus/kupla-tuikkulyhty",
					highlight: "Se luo tunnelmallista valoa <em>pimeänä</em> ilta.",
					domain: "shop.findkit.invalid",
					tags: [
						"category/sisustus",
						"language/fi",
						"product",
						"domain/shop.findkit.invalid",
					],
					created: "2023-11-04T00:00:00.000Z",
					modified: "2023-10-12T15:29:12.234Z",
					customFields: {
						category: {
							type: "keyword",
							value: "Sisustus",
						},
						weight: {
							type: "number",
							value: 0.4,
						},
						price: {
							type: "number",
							value: 19.5,
						},
						quantity: {
							type: "number",
							value: 67,
						},
					},
				},
			],
		},
	],
	duration: 18,
	messages: [],
};
