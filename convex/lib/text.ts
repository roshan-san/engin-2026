/**
 * Search indexes can only cover one field, so every searchable table keeps a
 * denormalised `searchText` built here. Always rebuild it on write.
 */
export function buildSearchText(
	...parts: (string | undefined | null)[]
): string {
	return parts
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
}

export function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function requireText(value: string, field: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new Error(`${field} is required`);
	}
	return trimmed;
}

/** Normalises optional form fields: blank strings become `undefined`. */
export function optionalText(value: string | undefined): string | undefined {
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
		throw new Error(`${field} must start with http:// or https://`);
	}
	return trimmed;
}
