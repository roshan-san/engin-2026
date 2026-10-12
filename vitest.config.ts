import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"~": fileURLToPath(new URL("./src", import.meta.url)),
			"@convex": fileURLToPath(new URL("./convex", import.meta.url)),
		},
	},
	test: {
		environment: "edge-runtime",
		include: ["convex/**/*.test.ts", "src/**/*.test.ts"],
		setupFiles: ["convex/testing/timers.setup.ts"],
		server: { deps: { inline: ["convex-test"] } },
	},
});
