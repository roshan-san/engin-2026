import type { z } from "zod";

export type ValidationResult<T> =
	| { ok: true; data: T }
	| { ok: false; message: string };

/**
 * Validates form input and collapses zod's issue list to the first message,
 * which is all the inline form UI ever shows.
 */
export function validate<Schema extends z.ZodType>(
	schema: Schema,
	input: unknown,
): ValidationResult<z.infer<Schema>> {
	const result = schema.safeParse(input);

	if (result.success) {
		return { ok: true, data: result.data };
	}

	return {
		ok: false,
		message: result.error.issues[0]?.message ?? "Please check your input",
	};
}

/** Convex and network failures both surface to the user as plain text. */
export function toErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) {
		// Convex prefixes server errors; keep only the message the app threw.
		return error.message.replace(/^\[.*?]\s*/, "").split("\n")[0] || fallback;
	}
	return fallback;
}
