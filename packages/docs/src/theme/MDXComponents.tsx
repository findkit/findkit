import React, { useState } from "react";
import { useIntersectionObserver } from "@valu/react-intersection-observer";
// Import the original mapper
import MDXComponents from "@theme-original/MDXComponents";

/**
 * Throw error during build the if the example does not exist
 */
function checkExists(example: string) {
	if (typeof window !== "undefined") {
		return;
	}

	// Use eval to avoid webpack bundling the fs module in the browser
	const fs: typeof import("fs") = eval(`require("fs")`);

	fs.statSync("../ui-examples/" + example);
}

function Api(props: { page: string; children: any }) {
	return (
		<>
			{" "}
			<a
				href={`https://docs.findkit.com/ui-api/${props.page.toLowerCase()}/`}
				target="_blank"
			>
				{props.children ?? "api docs"}
			</a>{" "}
		</>
	);
}

function Codesandbox(props: {
	example: string;
	link?: boolean;
	children?: any;
}) {
	checkExists(props.example);
	const [open, setOpen] = useState(false);
	const ref = useIntersectionObserver(() => {
		setOpen(true);
	});

	const openFile = props.example.startsWith("static/")
		? "index.html"
		: "src/index.tsx";

	const query = new URLSearchParams({
		codesandbox: "1",
		fontsize: "14",
		hidenavigation: "1",
		theme: "dark",
		module: openFile,
		view: "preview",
	}).toString();

	const githubLink = `https://github.com/findkit/findkit/tree/main/packages/ui-examples/${props.example}/${openFile}`;
	const codesandboxLink = `https://codesandbox.io/s/github/findkit/findkit/tree/main/packages/ui-examples/${props.example}`;
	const embedSrc = `https://codesandbox.io/embed/github/findkit/findkit/tree/main/packages/ui-examples/${props.example}?${query}`;
	const newTabUrl = `https://docs.findkit.com/ui-examples/${props.example}`;

	if (props.link) {
		return (
			<>
				{" "}
				<a href={codesandboxLink}>{props.children}</a>{" "}
			</>
		);
	}

	return (
		<div className="codesandbox-example">
			Open in a
			<a href={newTabUrl} target="_blank">
				new tab
			</a>
			view source code in
			<a href={githubLink} target="_blank">
				Github
			</a>
			or edit online in
			<a href={codesandboxLink} target="_blank">
				Codesandbox
			</a>
			{!open ? (
				<div ref={ref} className="codesandbox-placehoder">
					<button onClick={() => setOpen(true)}>Load Codesandbox</button>
				</div>
			) : (
				<iframe
					src={embedSrc}
					style={{
						width: "100%",
						height: "500px",
						border: 0,
						borderRadius: "4px",
						overflow: "hidden",
					}}
					title={`findkit/findkit: ${props.example}`}
					sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
				/>
			)}
		</div>
	);
}

export default {
	...MDXComponents,
	Codesandbox,
	Api,
};
