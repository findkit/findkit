import { createRoot } from "react-dom/client";
import React, { useEffect, useRef } from "react";
import { FindkitUI } from "@findkit/ui";

function App() {
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const ui = new FindkitUI({
			publicToken: "p68GxRvaA",
			container: containerRef.current,
			minTerms: 0,
			header: false,
			modal: false,
		});

		if (inputRef.current) {
			ui.bindInput(inputRef.current);
		}

		return () => {
			// Ensure that all event listeners are removed when the component is
			// unmounted
			ui.dispose();
		};
	});

	return (
		<div>
			<h1>Custom Container in React</h1>

			<input type="text" ref={inputRef} placeholder="Search" />
			<div className="custom-container" ref={containerRef} />
		</div>
	);
}

const container = document.getElementById("root");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}
