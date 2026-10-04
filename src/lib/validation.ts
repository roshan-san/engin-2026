import { z } from "zod";

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
		// Convex wraps server errors as "[CONVEX …] [Request ID: …] Server Error
		// Uncaught Error: <message>", once more for a mutation run inside an
		// action; keep only the innermost message the app threw.
		const thrown = /(?:Uncaught \w*Error: )+(.+)/.exec(error.message)?.[1];
		const message =
			thrown ?? error.message.replace(/^(\[[^\]]*]\s*)+/, "").split("\n")[0];
		return message && message !== "Server Error" ? message.trim() : fallback;
	}
	return fallback;
}

/** A required text field, trimmed, with the same bound the backend enforces. */
export function requiredText(field: string, max: number) {
	return z
		.string()
		.trim()
		.min(1, `${field} is required`)
		.max(max, `${field} must be under ${max} characters`);
}

/** An optional text field: blank becomes `undefined`, so a save clears it. */
export function optionalText(field: string, max: number) {
	return z
		.string()
		.trim()
		.max(max, `${field} must be under ${max} characters`)
		.transform((value) => value || undefined);
}
