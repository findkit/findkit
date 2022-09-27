import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				fullscreen: resolve(__dirname, "vite/fullscreen.html"),
			},
		},
	},
});
