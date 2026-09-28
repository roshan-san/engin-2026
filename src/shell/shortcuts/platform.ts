/** True on macOS/iOS, where shortcut labels show ⌘ instead of Ctrl. */
export function isApplePlatform(): boolean {
	if (typeof navigator === "undefined") {
		return false;
	}
	return /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);
}

/**
 * Formats a registry `key` for display. `"mod+k"` becomes `⌘K` on Apple
 * platforms and `Ctrl K` elsewhere; single keys (`"/"`, `"?"`) are returned
 * as-is. `null` (no shortcut) becomes `null`.
 */
export function formatShortcut(key: string | null | undefined): string | null {
	if (!key) {
		return null;
	}
	if (key === "mod+k") {
		return isApplePlatform() ? "⌘K" : "Ctrl K";
	}
	return key;
}
