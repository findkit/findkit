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
				"crawler/running-crawls",
				"crawler/indexing",
				"crawler/testing-crawls",
				"crawler/languages",
				"crawler/data-attributes",
				"crawler/pdf",
				"crawler/tagging",
				"crawler/meta-tag",
				"crawler/rest-api",
				"crawler/export",
			],
		},
		{
			type: "category",
			label: "findkit.toml",
			link: { type: "doc", id: "toml/index" },
			items: ["toml/options", "toml/example", "toml/tags"],
		},
		{
			type: "category",
			label: "Workers",
			link: { type: "doc", id: "workers/index" },
			items: ["workers/events", "workers/runtime"],
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
					items: [
						"ui/api/params",
						"ui/api/groups",
						"ui/api/events",
						"ui/api/utils",
					],
				},
				"ui/styling",
				{
					type: "category",
					label: "Filtering",
					link: { type: "doc", id: "ui/filtering/index" },
					items: ["ui/filtering/intro", "ui/filtering/operators"],
				},
				"ui/custom-router-data",
				"ui/tech",
				{
					type: "category",
					label: "Embedding Patterns",
					link: { type: "doc", id: "ui/patterns/embedding/index" },
					items: [
						"ui/patterns/embedding/fullscreen",
						"ui/patterns/embedding/offset",
						"ui/patterns/embedding/content-overlay",
						"ui/patterns/embedding/raw",
						"ui/patterns/embedding/react",
					],
				},
				{
					type: "category",
					label: "Slot Overrides",
					link: { type: "doc", id: "ui/slot-overrides/index" },
					items: [
						"ui/slot-overrides/slots",
						"ui/slot-overrides/hooks",
						"ui/slot-overrides/custom-fields",
					],
				},
				"ui/translations",
				{
					type: "category",
					label: "Advanced",
					items: [
						"ui/api-docs",
						"ui/advanced/disable-cdn",
						"ui/advanced/routing",
					],
				},
			],
		},
		"fetch",
	],
};

module.exports = sidebars;
