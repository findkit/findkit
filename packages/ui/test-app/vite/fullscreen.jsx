import { FindkitUI } from "/build/esm/index.js";
import { createRoot } from "react-dom/client";
import React, { useRef, useEffect } from "react";

const ui = new FindkitUI({
	publicToken: "p68GxRvaA",
	styleSheet: "/build/styles.css",
	async load() {
		return import("/build/esm/implementation.js");
	},
});

function App() {
	const ref = useRef(null);

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

const container = document.getElementById("root");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}
