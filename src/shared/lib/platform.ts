/** True on Apple devices, where the shortcut key is ⌘ rather than Ctrl. */
export function isMac(): boolean {
	if (typeof navigator === "undefined") return false;
	return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Whether the main pointer is a finger. Read when a key is pressed, as it can change. */
export function isCoarsePointer(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(pointer: coarse)").matches
	);
}
