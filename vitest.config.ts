import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@mocks": path.resolve(__dirname, "./src/test/mocks"),
			"@hass-connect-fake/mocks": path.resolve(__dirname, "./src/test/mocks"),
			"@mocks/mockConnection": path.resolve(
				__dirname,
				"./src/test/mocks/mockConnection.ts",
			),
			"@hass-connect-fake/mocks/mockConnection": path.resolve(
				__dirname,
				"./src/test/mocks/mockConnection.ts",
			),
		},
	},
});
