import { afterEach, beforeEach, vi } from "vitest";

/** Every test runs on fake timers, so scheduled functions can be advanced past. */
beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});
