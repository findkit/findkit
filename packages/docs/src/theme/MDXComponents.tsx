import React, { useState } from "react";
import { useIntersectionObserver } from "@valu/react-intersection-observer";
// Import the original mapper
import MDXComponents from "@theme-original/MDXComponents";

function Api(props: { page: string; children: any }) {
	return (
		<>
			{" "}
			<a href={`https://docs.findkit.com/ui-api/${props.page.toLowerCase()}/`}>
				{props.children ?? "Api docs."}
			</a>{" "}
		</>
	);
}

function Codesandbox(props: {
	example: string;
	link?: boolean;
	children?: any;
}) {
	const [open, setOpen] = useState(false);
	const ref = useIntersectionObserver(() => {
		setOpen(true);
	});

	const query = new URLSearchParams({
		codesandbox: "1",
		fontsize: "14",
		hidenavigation: "1",
		theme: "dark",
		module: "index.html",
		view: "preview",
	}).toString();

	const githubLink = `https://github.com/findkit/findkit/tree/main/packages/ui-examples/${props.example}/index.html`;
	const codesandboxLink = `https://codesandbox.io/s/github/findkit/findkit/tree/main/packages/ui-examples/${props.example}`;
	const embedSrc = `https://codesandbox.io/embed/github/findkit/findkit/tree/main/packages/ui-examples/${props.example}?${query}`;

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
			View on
			<a href={githubLink}>Github</a>
			or edit online on
			<a href={codesandboxLink}>Codesandbox</a>
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
