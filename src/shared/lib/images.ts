/**
 * Keeps the image files that fit in `room`. Everything else, whether not an
 * image or over the limit, counts as skipped.
 */
export function pickImages(
	files: File[],
	room: number,
): { accepted: File[]; skipped: number } {
	const accepted = files
		.filter((file) => file.type.startsWith("image/"))
		.slice(0, Math.max(0, room));
	return { accepted, skipped: files.length - accepted.length };
}
