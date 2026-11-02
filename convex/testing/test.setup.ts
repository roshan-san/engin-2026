/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { vi } from "vitest";
import schema from "../schema";

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

/** Every Convex module, for `convexTest`. Test files are left out. */
const modules = import.meta.glob(["../**/*.*s", "!../**/*.test.ts"]);

export function createTest() {
	return convexTest(schema, modules);
}

export type TestConvex = ReturnType<typeof createTest>;
/** A client acting as one signed-in person. */
export type Client = ReturnType<TestConvex["withIdentity"]>;

export async function advancePast(t: TestConvex, ms: number) {
	vi.advanceTimersByTime(ms);
	await t.finishInProgressScheduledFunctions();
}
