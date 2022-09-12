import React, { useEffect } from "react";
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "p68GxRvaA",
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
			🔎
		</button>
	);
}
