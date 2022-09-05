import React, { useEffect } from "react";
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "p68GxRvaA",
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
