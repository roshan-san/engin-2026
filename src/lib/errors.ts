/**
 * The plain message from a thrown error. Convex wraps server errors as
 * "[CONVEX M(...)] [Request ID: ...] Server Error\nUncaught Error: <message>\n  at ...".
 */
export function errorMessage(error: unknown): string {
	const raw = error instanceof Error ? error.message : "";
	const thrown = raw.match(/Uncaught \w*Error:[ \t]*(.+)/)?.[1];
	const withoutPrefix = raw.replace(/^(\[[^\]]*\]\s*)+/, "");
	const message = thrown ?? withoutPrefix.split("\n")[0];
	return message?.trim() || "Something went wrong";
}
