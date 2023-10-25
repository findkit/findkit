import "./styles.css";
import { createRoot } from "react-dom/client";
import React, { useEffect, useRef, useState } from "react";
import { FindkitUI, SearchParams } from "@findkit/ui";

function App() {
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const uiRef = useRef<FindkitUI>();
	const [params, setParams] = useState<SearchParams>();
	const currentTag = params?.tagQuery?.[0]?.[0];

	const setTag = (tag?: string) => {
		uiRef.current?.setCustomRouterData({ tag: tag ?? "" });
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
			async load() {
				return impl;
			},
		});

		// Sync Search Params to the React tate
		setParams(ui.params);
		ui.on("params", (e) => {
			setParams(e.params);
		});

		// Restore previous state from the url
		ui.on("custom-router-data", (e) => {
			if (e.data.tag) {
				setTag(e.data.tag);
			}
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
			<h1>Inside React Component</h1>

			<div className="controls">
				<h2>Filter by tags</h2>
				<div className="buttons">
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

					<button
						disabled={currentTag === null}
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
