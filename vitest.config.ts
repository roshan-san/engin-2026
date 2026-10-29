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
		// Anything that loads shared/api/convex.ts, whose client needs an address. A fixed one
		// keeps tests off your dev backend and passing without .env.local (CI).
		env: { VITE_CONVEX_URL: "https://tests.convex.cloud" },
		include: ["convex/**/*.test.ts", "src/**/*.test.ts"],
		setupFiles: ["convex/testing/timers.setup.ts"],
		server: { deps: { inline: ["convex-test"] } },
	},
});
