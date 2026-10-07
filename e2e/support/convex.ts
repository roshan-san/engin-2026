import { execFileSync } from "node:child_process";
import { ConvexHttpClient } from "convex/browser";

process.loadEnvFile(".env.local");

const convexUrl = process.env.VITE_CONVEX_URL;
if (!convexUrl) {
	throw new Error("VITE_CONVEX_URL is missing from .env.local");
}
if (!process.env.CONVEX_DEPLOYMENT?.startsWith("dev:")) {
	throw new Error("E2E tests only run against a dev deployment");
}

export const CONVEX_URL = convexUrl;

export function convexClient() {
	return new ConvexHttpClient(CONVEX_URL);
}

/** Runs an internal `convex/e2e/seed.ts` mutation; the deployment needs E2E=1. */
export function seed(name: "startHackathon" | "giveCredit", args: object) {
	// The CLI's own entry point, so no shell mangles the JSON argument.
	execFileSync(
		process.execPath,
		[
			"node_modules/convex/bin/main.js",
			"run",
			`e2e/seed:${name}`,
			JSON.stringify(args),
		],
		{ stdio: "pipe" },
	);
}
