import "./styles.css";
import { createRoot } from "react-dom/client";
import React, { useEffect, useRef, useState } from "react";
import { FindkitUI, SearchParams } from "@findkit/ui";

function getTag(params: SearchParams | undefined) {
	return params?.tagQuery?.[0]?.[0] ?? "";
}

function App() {
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const uiRef = useRef<FindkitUI>();
	const [params, setParams] = useState<SearchParams>();

	const setTag = (tag: string | null) => {
		uiRef.current?.updateParams((params) => {
			if (tag) {
				params.tagQuery = [[tag]];
			} else {
				params.tagQuery = [];
			}
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

		uiRef.current = ui;

		setParams(ui.params);

		ui.on("params", (e) => {
			setParams(e.params);
		});

		if (inputRef.current) {
			ui.bindInput(inputRef.current);
		}

		// Ensure the UI state is restored when user navigates back to the page
		// https://docs.findkit.com/ui/api/custom-router-data
		ui.customRouterData({
			init: { tag: "" },
			load(data) {
				setTag(data.tag);
			},
			save() {
				return { tag: getTag(ui.params) };
			},
		});

		return () => {
			// Ensure that all event listeners are removed when the component is
			// unmounted
			ui.dispose();
		};
	}, []);

	return (
		<div>
			<h1>Inside React Component</h1>

			<div className="controls">
				<h2>Filter by tag</h2>
				<div className="buttons">
					<button
						disabled={getTag(params) === "crawler"}
						onClick={() => {
							setTag("crawler");
						}}
					>
						crawler
					</button>

					<button
						disabled={getTag(params) === "ui"}
						onClick={() => {
							setTag("ui");
						}}
					>
						ui
					</button>

					<button
						disabled={getTag(params) === ""}
						onClick={() => {
							setTag(null);
						}}
					>
						clear
					</button>
				</div>

				<h2>Search terms</h2>
				<input type="text" ref={inputRef} placeholder="Search" />
			</div>

			<div className="custom-container" ref={containerRef} />
		</div>
	);
}

const container = document.getElementById("root");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}
