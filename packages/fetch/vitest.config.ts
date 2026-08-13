import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Vitest 4 narrowed its default excludes to node_modules and .git only.
		// Earlier versions also skipped dist by default, so without this the
		// compiled copy of every test under dist/ is collected after a build and
		// the whole suite runs twice -- once from source, once from the emitted
		// JavaScript.
		exclude: ["**/node_modules/**", "**/dist/**"],
	},
});
