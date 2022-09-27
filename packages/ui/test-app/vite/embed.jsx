import { FindkitUI } from "/build/esm/index.js";
import { createRoot } from "react-dom/client";
import React, { useRef, useEffect } from "react";

function App() {
	const inputRef = useRef(null);
	const containerRef = useRef(null);
	const uiRef = useRef(null);
	const [params, setParams] = React.useState({});
	const currentTag = params.tagQuery?.[0]?.[0];
	const setTag = (tag) => {
		uiRef.current.updateParams((params) => {
			params.tagQuery = [[tag]];
		});
	};

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
			styleSheet: "/build/styles.css",
			params: {
				tagQuery: [["crawler"]],
			},
			async load() {
				return import("/build/esm/implementation.js");
			},
		});

		setParams(ui.params);

		ui.events.on("params", (e) => {
			setParams(e.params);
		});

		if (inputRef.current) {
			ui.bindInput(inputRef.current);
		}

		uiRef.current = ui;

		return () => {
			// Ensure that all event listeners are removed when the component is
			// unmounted
			ui.dispose();
		};
	}, []);

	return (
		<div>
			<h1>Custom Container in React2</h1>

			<pre>{JSON.stringify(params, null, 2)}</pre>

			<div>
				<button
					disabled={currentTag === "crawler"}
					onClick={() => {
						setTag("crawler");
					}}
				>
					crawler
				</button>

				<button
					disabled={currentTag === "ui"}
					onClick={() => {
						setTag("ui");
					}}
				>
					ui
				</button>
			</div>

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
