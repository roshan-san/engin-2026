import { afterEach, beforeEach, vi } from "vitest";

/**
 * A Saturday noon IST, so results don't depend on the day the tests run. Close to a
 * Monday on purpose: a delay over 24.8 days overflows `setTimeout` and fires at once,
 * which a scheduled `closeDeciding` could reach from earlier in the week.
 */
const TEST_NOW = new Date("2026-06-06T06:30:00Z");

/** Every test runs on fake timers, so scheduled functions can be advanced past. */
beforeEach(() => {
	vi.useFakeTimers({ now: TEST_NOW });
});

afterEach(() => {
	vi.useRealTimers();
});
