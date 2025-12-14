import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

const isDemo = process.env.VITE_DEMO === "1";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		// Bundle analyzer
		visualizer({
			filename: "dist/stats.html",
			open: true,
			gzipSize: true,
			brotliSize: true,
		}),
	],

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/components": path.resolve(__dirname, "./src/components"),
			"@/hooks": path.resolve(__dirname, "./src/hooks"),
			"@/stores": path.resolve(__dirname, "./src/stores"),
			"@/types": path.resolve(__dirname, "./src/types"),
			"@/lib": path.resolve(__dirname, "./src/lib"),
		},
	},

	server: {
		host: "0.0.0.0",
		port: 3000,
		open: true,
		strictPort: true,
	},


});
