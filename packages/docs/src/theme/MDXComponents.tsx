import React from "react";
// Import the original mapper
import MDXComponents from "@theme-original/MDXComponents";

function Codesandbox(props: { name: string }) {
	const query = new URLSearchParams({
		codesandbox: "1",
		fontsize: "14",
		hidenavigation: "1",
		theme: "dark",
		module: "index.html",
		view: "preview",
	}).toString();

	return (
		<div className="codesandbox-example">
			View on
			<a
				href={`https://github.com/findkit/findkit/tree/main/packages/ui-examples/${props.name}/index.html`}
			>
				Github
			</a>
			or edit on
			<a
				href={`https://codesandbox.io/s/github/findkit/findkit/tree/main/packages/ui-examples/${props.name}`}
			>
				Codesandbox
			</a>
			<iframe
				src={`https://codesandbox.io/embed/github/findkit/findkit/tree/main/packages/ui-examples/${props.name}?${query}`}
				style={{
					width: "100%",
					height: "500px",
					border: 0,
					borderRadius: "4px",
					overflow: "hidden",
				}}
				title={`findkit/findkit: ${props.name}`}
				sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
			/>
		</div>
	);
}

export default {
	...MDXComponents,
	Codesandbox,
};
