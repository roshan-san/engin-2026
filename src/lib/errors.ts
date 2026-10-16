import { ConvexError } from "convex/values";

/** The message a server guard threw: production redacts everything else. */
function convexErrorData(error: unknown): string | undefined {
	return error instanceof ConvexError && typeof error.data === "string"
		? error.data
		: undefined;
}

/**
 * The plain message from a thrown error. In dev, Convex wraps server errors as
 * "[CONVEX M(...)] [Request ID: ...] Server Error\nUncaught Error: <message>\n  at ...",
 * twice for a mutation run inside an action; this keeps only the innermost message.
 */
export function errorMessage(error: unknown): string {
	const data = convexErrorData(error);
	if (data) return data;
	const raw = error instanceof Error ? error.message : "";
	const thrown = raw.match(/(?:Uncaught \w*Error:[ \t]*)+(.+)/)?.[1];
	const withoutPrefix = raw.replace(/^(\[[^\]]*\]\s*)+/, "");
	const message = (thrown ?? withoutPrefix.split("\n")[0])?.trim();
	return message && message !== "Server Error"
		? message
		: "Something went wrong";
}
