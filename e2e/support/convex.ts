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
