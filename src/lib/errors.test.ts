import { expect, test } from "vitest";
import { errorMessage } from "./errors";

test("a server error shows only the message the server threw", () => {
	const error = new Error(
		"[CONVEX M(startups/startups:create)] [Request ID: abc123] Server Error\nUncaught Error: Name is required.\n    at handler (../convex/startups/startups.ts:84:2)",
	);

	expect(errorMessage(error)).toBe("Name is required.");
});

test("an error without the Convex wrapper keeps its message", () => {
	expect(errorMessage(new Error("Offline"))).toBe("Offline");
});

test("anything else falls back to a plain message", () => {
	expect(errorMessage("boom")).toBe("Something went wrong");
});
