/**
 * Plain Enter sends; Shift+Enter is a newline and an IME's Enter just confirms text.
 * On a touch screen (`coarse`) Enter is a newline too, and the Send button sends.
 */
export function isSendKey(
	e: {
		key: string;
		shiftKey: boolean;
		isComposing: boolean;
		/** Safari reports 229 for an IME's Enter after composition ends. */
		keyCode?: number;
	},
	options?: { readonly coarse?: boolean },
): boolean {
	return (
		e.key === "Enter" &&
		!e.shiftKey &&
		!e.isComposing &&
		e.keyCode !== 229 &&
		!options?.coarse
	);
}

/** Whether the main pointer is a finger. Read when a key is pressed, as it can change. */
export function isCoarsePointer(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(pointer: coarse)").matches
	);
}

/** Whether keys typed at `target` belong to a text field, not to shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
	const element = target as HTMLElement | null;
	if (!element || typeof element.tagName !== "string") return false;
	const tag = element.tagName.toLowerCase();
	return tag === "input" || tag === "textarea" || element.isContentEditable;
}
