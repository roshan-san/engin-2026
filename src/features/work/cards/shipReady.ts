/** The link in `text` when it's an http(s) URL, else `null`. */
export function parseLink(text: string): string | null {
	const trimmed = text.trim();
	try {
		const url = new URL(trimmed);
		return url.protocol === "http:" || url.protocol === "https:"
			? trimmed
			: null;
	} catch {
		return null;
	}
}

/**
 * What Ship still needs: the line first, then a link or an image. A valid link
 * typed but not yet added counts. `null` when it's ready.
 */
export function shipMissing(input: {
	readonly line: string;
	readonly links: readonly string[];
	readonly images: number;
	readonly linkText: string;
}): "line" | "link" | null {
	if (input.line.trim().length === 0) return "line";
	const hasProof =
		input.links.length > 0 ||
		input.images > 0 ||
		parseLink(input.linkText) !== null;
	return hasProof ? null : "link";
}
