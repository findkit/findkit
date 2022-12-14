import { resolve, join } from "path";
import { defineConfig } from "vite";
import { readdirSync } from "fs";

const entries = readdirSync(join(__dirname, "bundled"));

const input = Object.fromEntries(
	entries.flatMap((dir) => {
		const entry = [dir, resolve(__dirname, "bundled", dir, "index.html")];

		// Wrap to extra [] to avoid flattening
		return [entry];
	}),
);

export default defineConfig({
	root: __dirname + "/bundled",
	base: process.env.CI ? "/ui-examples/bundled/" : "",
	build: {
		outDir: __dirname + "/bundled-dist",
		emptyOutDir: true,
		minify: false,
		target: "esnext",
		rollupOptions: {
			input,
		},
	},
});
