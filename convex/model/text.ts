import { ConvexError } from "convex/values";

export function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function requireText(value: string, field: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new ConvexError(`${field} is required`);
	}
	return trimmed;
}

/** Normalises optional form fields: blank strings become `undefined`. */
function optionalText(value: string | undefined): string | undefined {
	return value?.trim() || undefined;
}

export function assertUrl(
	value: string | undefined,
	field: string,
): string | undefined {
	const trimmed = optionalText(value);
	if (!trimmed) {
		return undefined;
	}
	if (!/^https?:\/\/\S+\.\S+/.test(trimmed)) {
		throw new ConvexError(`${field} must start with http:// or https://`);
	}
	return trimmed;
}

/** An optional form field, trimmed, that must stay under `max` characters. */
export function limitText(
	value: string | undefined,
	field: string,
	max: number,
): string | undefined {
	const text = optionalText(value);
	if (text && text.length > max) {
		throw new ConvexError(`${field} must be under ${max} characters`);
	}
	return text;
}

/** A required form field, trimmed, that must stay under `max` characters. */
export function requireLimitedText(
	value: string,
	field: string,
	max: number,
): string {
	const text = requireText(value, field);
	if (text.length > max) {
		throw new ConvexError(`${field} must be under ${max} characters`);
	}
	return text;
}
