import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [vue()],
	root: "./",
	server: {
		port: 3000,
		open: true,
	},
});
