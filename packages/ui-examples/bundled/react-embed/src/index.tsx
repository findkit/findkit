import { createRoot } from "react-dom/client";
import React, { useEffect, useRef } from "react";
import { FindkitUI } from "@findkit/ui";

const ui = new FindkitUI({
	publicToken: "p68GxRvaA",
});

function App() {
	const ref = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (ref.current) {
			// Return the unbind function as the effect clean up
			return ui.openFrom(ref.current);
		}
	});

	return (
		<div>
			<h1>React Embedding</h1>

			<p>The fullscreen modal pattern inside React.js.</p>

			<button ref={ref} type="button">
				Open Search
			</button>
		</div>
	);
}

const container = document.getElementById("app");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}
