/** True on Apple devices, where the shortcut key is ⌘ rather than Ctrl. */
export function isMac(): boolean {
	if (typeof navigator === "undefined") return false;
	return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
