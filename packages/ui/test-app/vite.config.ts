import { resolve, join } from "path";
import { defineConfig } from "vite";
import { readdirSync } from "fs";

const entries = readdirSync(join(__dirname, "vite"));

const input = Object.fromEntries(
	entries.flatMap((file) => {
		if (!file.endsWith(".html")) {
			return [];
		}

		if (file.endsWith("index.html")) {
			return [];
		}

		const entry = [file.split(".")[0], resolve(__dirname, "vite", file)];

		// Wrap to extra [] to avoid flattening
		return [entry];
	}),
);

export default defineConfig({
	build: {
		rollupOptions: {
			input,
		},
	},
});
