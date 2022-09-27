import { createRoot } from "react-dom/client";
import React from "react";
import { FindkitUI } from "@findkit/ui";

function App() {
	return <div>hello react</div>;
}

const container = document.getElementById("app")!;

const root = createRoot(container);
root.render(<App />);
