// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: "Findkit Docs",
	// tagline: "Dinosaurs are cool",
	url: "https://docs.findkit.com",
	baseUrl: "/",
	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "throw",
	favicon: "img/favicon.png",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "findkit", // Usually your GitHub org/user name.
	projectName: "findkit", // Usually your repo name.

	clientModules: [
		require.resolve("./src/css-target-fix.ts"),
		require.resolve("./src/redirects.ts"),
	],

	// Even if you don't use internalization, you can use this field to set useful
	// metadata like html lang. For example, if your site is Chinese, you may want
	// to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			/** @type {import('@docusaurus/preset-classic').Options} */
			({
				docs: {
					routeBasePath: "/", // Serve the docs at the site's root,
					sidebarPath: require.resolve("./sidebars.js"),
					editUrl: "https://github.com/findkit/findkit/tree/main/packages/docs",
				},
				blog: false,
				theme: {
					customCss: require.resolve("./src/css/custom.css"),
				},
			}),
		],
	],

	themeConfig:
		/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
		({
			navbar: {
				title: "",
				logo: {
					alt: "Findkit logo",
					src: "img/logo.svg",
				},
				items: [
					{
						href: "https://hub.findkit.com/",
						label: "Hub",
						position: "right",
					},
					{
						href: "https://www.findkit.com/blog",
						label: "Blog",
						position: "right",
					},
				],
			},
			footer: {
				style: "dark",
				links: [
					{
						title: "Links",
						items: [
							{
								label: "Github",
								href: "https://github.com/findkit/findkit/",
							},
							{
								label: "Findkit Hub",
								href: "https://hub.findkit.com/",
							},
							{
								label: "Findkit Blog",
								href: "https://findkit.com/blog",
							},
						],
					},
					{
						title: "Follow us for updates",
						items: [
							{
								label: "Newsletter",
								href: "https://mailchi.mp/510383ab413a/findkit-newsletter",
							},
							{
								label: "Twitter / X",
								href: "https://twitter.com/findkitcom",
							},
							{
								label: "RSS",
								href: "https://www.findkit.com/feed/",
							},
						],
					},
					{
						title: "Support",
						items: [
							{
								label: "Contact",
								href: "https://findkit.com/contact",
							},
						],
					},
				],
				// copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
			},
			prism: {
				theme: lightCodeTheme,
				darkTheme: darkCodeTheme,
				additionalLanguages: ["toml", "php"],
			},
		}),
};

module.exports = config;
