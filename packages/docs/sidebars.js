/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
	// By default, Docusaurus generates a sidebar from the docs folder structure
	// sidebar: [{ type: "autogenerated", dirName: "." }],
	sidebar: [
		"intro",
		{
			type: "category",
			label: "Crawler",
			items: [
				"crawler/getting-started",
				"crawler/indexing",
				"crawler/starting",
				"crawler/tagging",
				{
					type: "category",
					label: "Crawler Configuration (TOML)",
					link: { type: "doc", id: "crawler/toml/index" },
					items: ["crawler/toml/tags"],
				},
				"crawler/meta-tag",
				"crawler/custom-fields",
				"crawler/rest-api",
				"crawler/jwt",
			],
		},
		{
			type: "category",
			label: "UI Library",
			link: { type: "doc", id: "ui/index" },
			items: [
				"ui/setup",
				{
					type: "category",
					label: "API",
					link: { type: "doc", id: "ui/api/index" },
					items: ["ui/api/params", "ui/api/events", "ui/api/utils"],
				},
				"ui/groups",
				"ui/styling",
				"ui/tech",
				{
					type: "category",
					label: "Embedding Patterns",
					// link: { type: "doc", id: "" },
					items: [
						"ui/patterns/embedding/fullscreen",
						"ui/patterns/embedding/offset",
						"ui/patterns/embedding/content-overlay",
						"ui/patterns/embedding/raw",
						"ui/patterns/embedding/react",
						// {
						// 	type: "category",
						// 	label: "Embedding Patterns",
						// 	link: { type: "doc", id: "ui/patterns/embedding/index" },
						// 	items: [
						// 	],
						// },

						// "ui/patterns/ui/index",
					],
				},
				{
					type: "category",
					label: "Slot Overrides",
					link: { type: "doc", id: "ui/slot-overrides/index" },
					items: ["ui/slot-overrides/slots", "ui/slot-overrides/hooks"],
				},
				{
					type: "category",
					label: "Advanced",
					// link: { type: "doc", id: "" },
					items: ["ui/advanced/disable-cdn", "ui/advanced/routing"],
				},
				"ui/api-docs",
				"ui/translations",
			],
		},
		"fetch-lib",
	],
};

module.exports = sidebars;
