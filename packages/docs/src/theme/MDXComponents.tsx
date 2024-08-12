import React, { useState } from "react";
import { useIntersectionObserver } from "@valu/react-intersection-observer";

// @ts-ignore
import MDXComponents from "@theme-original/MDXComponents";

/**
 * Throw error during build the if the example does not exist
 */
function checkExists(example: string) {
	if (typeof window !== "undefined") {
		return;
	}

	// Use eval to prevent webpack from bundling the fs module
	const fs: typeof import("fs") = eval(`require("fs")`);

	fs.statSync("../ui-examples/" + example);
}

/**
 * Mark to be indexed as fragment pages in Findkit
 */
function Fragmented(props: {
	/**
	 * Create fragment page from the content after h1 tag
	 */
	withH1?: boolean;
}) {
	return (
		<script className="findkit-fragmented" data-with-h1={props.withH1}></script>
	);
}

/**
 * Overide the previous element text content in Findkit Fragment Pages.
 * Used for custom titles in the search interface
 */
function FragmentOverride(props: { text: string }) {
	return (
		<script
			className="findkit-fragment-override"
			data-text={props.text}
		></script>
	);
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

function JSBinOpener(props: { example: string }) {
	const [loading, setLoading] = useState(false);

	const onClick = async (e: { preventDefault: () => void }) => {
		const rawUserContentURL = `https://raw.githubusercontent.com/findkit/findkit/main/packages/ui-examples/${props.example}/index.html`;
		e.preventDefault();
		setLoading(true);
		const html = await fetch(rawUserContentURL).then((response) =>
			response.text(),
		);

		const url = new URL("https://jsbin.com/?live");
		url.searchParams.set("html", html);
		window.open(url.toString(), "_blank");
		setLoading(false);
	};

	return (
		<a href="https://jsbin.com/404" onClick={onClick}>
			{loading ? "Loading..." : "JSBin"}
		</a>
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
		: "src/index.ts";

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
		<div className="live-example">
			<script
				id="findkit"
				type="application/json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						customFields: {
							exampleTitle: {
								type: "keyword",
								value: props.example,
							},
							githubLink: {
								type: "keyword",
								value: githubLink,
							},
							viewLink: {
								type: "keyword",
								value: newTabUrl,
							},
							codesandboxLink: {
								type: "keyword",
								value: codesandboxLink,
							},
						},
						tags: ["has_example"],
					}),
				}}
			></script>
			Open in a{" "}
			<a href={newTabUrl} target="_blank">
				new tab
			</a>{" "}
			view source code in{" "}
			<a href={githubLink} target="_blank">
				Github
			</a>{" "}
			or edit online in{" "}
			{props.example.startsWith("static/") ? (
				<>
					<JSBinOpener example={props.example} /> or{" "}
				</>
			) : null}{" "}
			<a href={codesandboxLink} target="_blank">
				Codesandbox
			</a>
			<div className="live-example-wrap">
				{!open ? (
					<div ref={ref} className="iframe-embed">
						<button onClick={() => setOpen(true)}>Load example</button>
					</div>
				) : (
					<iframe
						src={newTabUrl}
						className="iframe-embed"
						style={{
							width: "100%",
							height: "500px",
							border: "0",
							overflow: "hidden",
						}}
						title={`findkit/findkit: ${props.example}`}
						sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
					/>
				)}
			</div>
		</div>
	);
}

export default {
	...MDXComponents,
	Codesandbox,
	Api,
	Fragmented,
	FragmentOverride,
};
