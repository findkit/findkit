import React, { useEffect } from "react";
import { FindkitUI, css } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "p68GxRvaA",
	// async load() {
	// 	return import("@findkit/ui/implementation");
	// },
	css: css`
		:host {
			/* Use the docusaurus font */
			font-family: inherit;
		}
	`,
	params: {
		tagQuery: [],
	},
	// groups: [
	// 	{
	// 		id: "generic",
	// 		title: "Generic",
	// 		tagQuery: [["re/root"]],
	// 	},
	// 	{
	// 		id: "crawler",
	// 		title: "Crawler",
	// 		tagQuery: [["re/crawler"]],
	// 	},
	// 	{
	// 		id: "ui",
	// 		title: "UI",
	// 		tagQuery: [["re/ui"]],
	// 	},
	// ],
});

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
