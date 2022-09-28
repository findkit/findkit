import "./styles.css";
import { createRoot } from "react-dom/client";
import React, { useEffect, useRef, useState } from "react";
import { FindkitUI, SearchEngineParams } from "@findkit/ui";

function App() {
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const uiRef = useRef<FindkitUI>();
	const [params, setParams] = useState<SearchEngineParams>();
	const currentTag = params?.tagQuery?.[0]?.[0];

	const setTag = (tag: string) => {
		uiRef.current?.updateParams((params) => {
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
			params: {
				tagQuery: [["crawler"]],
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
