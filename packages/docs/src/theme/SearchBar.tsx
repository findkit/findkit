// Docusaurus search bar component
// See setup in https://docs.findkit.com/ui/setup

import React, { useEffect } from "react";
import { FindkitUI, html, css, useTerms, HitSlotProps } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "p68GxRvaA",
	// Show search results even without search terms so we can get the blog
	// posts
	minTerms: 0,

	// Add some custom styles into the FindkitUI Shadow DOM
	// https://docs.findkit.com/ui/styling
	css: css`
		.findkit--magnifying-glass-lightning {
			visibility: visible;
		}

		@media (min-width: 900px) and (min-height: 600px) {
			.findkit--modal {
				margin-top: 3rem;
				margin-bottom: 3rem;
				max-width: 850px;
			}
		}

		.blog-created {
			margin-bottom: 0.5rem;
			font-style: italic;
			color: gray;
			font-size: small;
			margin-left: var(--findkit--space-3);
		}

		.view-source,
		.view-source:hover {
			margin-left: var(--findkit--space-3);
			text-decoration: none;
			margin-bottom: var(--findkit--space-3);
			color: var(--findkit--brand-color);
			font-size: small;
		}
		.view-source:hover {
			text-decoration: underline;
		}
	`,

	// Create three groups: docs, findkitcom, and blog
	// https://docs.findkit.com/ui/api/groups
	groups: [
		{
			id: "docs",
			title: "Docs",
			params: {
				// Initially skip searching the docs group as we only show the blog group
				// https://docs.findkit.com/ui/api/params#skip
				skip: true as boolean,

				// Limit the group results to only the docs.findkit.com domain
				// This tag is automatically added by the Findkit crawler
				// https://docs.findkit.com/ui/filtering/
				filter: { tags: "domain/docs.findkit.com" },
			},
		},
		{
			id: "findkitcom",
			title: "Findkit.com",
			params: {
				skip: true as boolean,
				filter: { tags: "domain/findkit.com" },
			},
		},
		{
			id: "blog",
			title: "Latest from the Blog",
			params: {
				// Let the blog group to be searched
				skip: false as boolean,

				// Limit the group to only blog posts. This tag is
				// automatically added by the wp-findkit WordPress plugin
				// https://findk.it/wp
				filter: { tags: "wp_post_type/post" },

				// Show the latest blog posts first
				// https://docs.findkit.com/ui/api/params#sort
				sort: { created: { $order: "desc" } },
			},
		},
	],

	// Slots are Preact components that can be used to customize the UI
	// https://docs.findkit.com/ui/slot-overrides/
	slots: {
		// Create custom header just to add the custom placeholder text to the input
		// https://docs.findkit.com/ui/slot-overrides/slots#header
		Header(props) {
			// Must use the build-in html tagged template literal to render
			// HTML instead of JSX because JSX is for the React in Docusaurus
			// in this file
			return html`
				<${props.parts.CloseButton} />
				<${props.parts.Input} placeholder="Search from the docs..." />
			`;
		},

		// https://docs.findkit.com/ui/slot-overrides/slots#group
		Group(props) {
			// Capture the search terms using the useTerms hook
			// https://docs.findkit.com/ui/slot-overrides/hooks#useTerms
			const terms = useTerms();

			// When rendering the blog group, show the custom title and the
			// Hits component
			if (props.id === "blog") {
				// Show blog group only when there are no search terms
				if (terms.trim() === "") {
					return html`
						<h2 class="findkit--group-title">Latest from the Blog</h2>
						<a
							class="view-source"
							href="https://github.com/findkit/findkit/blob/main/packages/docs/src/theme/SearchBar.tsx"
							>View the source code for this search implementation</a
						>
						<${props.parts.Hits} />
					`;
				} else {
					// Hide the blog group when there are search terms
					return null;
				}
			}

			// Hide other groups when there are no search terms
			if (terms.trim() === "") {
				return null;
			}

			// Render other groups normally when there are search terms
			return props.children;
		},

		// https://docs.findkit.com/ui/slot-overrides/slots#hit
		Hit(props) {
			const terms = useTerms();

			// Render custom view for the findkitcom group when no terms are entered
			if (terms.trim() === "" && props.groupId === "blog") {
				return html`<${BlogHit} ...${props} />`;
			}

			return props.children;
		},
	},
});

// Modify the search request on the fly based on the search terms
ui.on("fetch", (e) => {
	e.transientUpdateGroups((docs, findkitcom, blog) => {
		// Fetch only the blog group when there are no search terms
		if (e.terms.trim() !== "") {
			blog.params.skip = false;
			docs.params.skip = true;
			findkitcom.params.skip = true;
		}
	});
});

// Custom Slot Override component for FindkitUI which renders the created date
// for the blog posts
function BlogHit(props: HitSlotProps) {
	const created = props.hit.created;
	const createdFormatted = created
		? new Date(created).toLocaleDateString()
		: null;

	return html`
		<${props.parts.TitleLink} />
		<${props.parts.Highlight}
			highlight=${props.hit.customFields.excerpt?.value ?? ""}
		/>
		<div class="blog-created">${createdFormatted}</div>
	`;
}

// Dispose the UI when the module is hot reloaded by the Docusaurus dev server
// https://docs.findkit.com/ui/api/#hot-module-reloading
declare const module: any;
module.hot?.dispose(() => {
	ui.dispose();
});

// Wrap FindkitUI into a React Component. This export is picked by Docusaurus.
// https://docs.findkit.com/ui/patterns/embedding/react
export default function SearchBarWrapper() {
	useEffect(() => {
		return ui.openFrom("button.open-search");
	}, []);

	return (
		<button type="button" className="open-search">
			<Logo />
		</button>
	);
}

export function Logo() {
	return (
		<svg
			className="search-bar-findkit-logo"
			xmlns="http://www.w3.org/2000/svg"
			width={30}
			height={30}
			viewBox="0 0 24 20"
		>
			<path
				fill="currentColor"
				d="M14.303 8.65c-.027 3.444-2.696 6.209-5.958 6.18-3.263.034-5.932-2.736-5.965-6.18.033-3.442 2.702-6.207 5.965-6.178 3.262-.03 5.931 2.741 5.958 6.179zm4.243 10.537a1.906 1.906 0 0 0-.032-2.592l-3.154-3.277a8.82 8.82 0 0 0 1.33-4.656C16.69 3.88 12.951 0 8.344 0 3.736 0 0 3.886 0 8.662c0 4.777 3.736 8.657 8.345 8.657a8.13 8.13 0 0 0 4.488-1.38l3.153 3.277a1.751 1.751 0 0 0 2.528 0c.01-.012.022-.018.032-.029z"
			/>
			<path
				fill="currentColor"
				d="M21.602 11.719V8.45l-2.852 4.198h1.623c.058 0 .106.051.106.114v3.275l2.852-4.198h-1.623c-.058 0-.106-.051-.106-.115"
			/>
		</svg>
	);
}
