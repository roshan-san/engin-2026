import { ConvexError } from "convex/values";
import { expect, test } from "vitest";
import { errorMessage } from "./errors";

/** What a production deployment sends: the message is redacted, the data isn't. */
function productionError(data: string) {
	const error = new ConvexError(data);
	error.message =
		"[CONVEX M(work/cards:verify)] [Request ID: abc] Server Error";
	return error;
}

test("a server error shows only the message the server threw", () => {
	const error = new Error(
		"[CONVEX M(startups/startups:create)] [Request ID: abc123] Server Error\nUncaught Error: Name is required.\n    at handler (../convex/startups/startups.ts:84:2)",
	);

	expect(errorMessage(error)).toBe("Name is required.");
});

test("a production server error shows the message the server threw", () => {
	expect(errorMessage(productionError("Only the Founder can do this"))).toBe(
		"Only the Founder can do this",
	);
});

test("a mutation run inside an action shows only the innermost message", () => {
	const error = new Error(
		"[CONVEX A(billing/checkout:start)] Server Error\nUncaught Error: Uncaught Error: No plan selected.",
	);

	expect(errorMessage(error)).toBe("No plan selected.");
});

test("a redacted production error falls back to a plain message", () => {
	const error = new Error(
		"[CONVEX M(work/cards:verify)] [Request ID: abc] Server Error",
	);

	expect(errorMessage(error)).toBe("Something went wrong");
});

test("an error without the Convex wrapper keeps its message", () => {
	expect(errorMessage(new Error("Offline"))).toBe("Offline");
});

test("anything else falls back to a plain message", () => {
	expect(errorMessage("boom")).toBe("Something went wrong");
});
