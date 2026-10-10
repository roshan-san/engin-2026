/** Plain Enter sends; Shift+Enter is a newline and an IME's Enter just confirms text. */
export function isSendKey(e: {
	key: string;
	shiftKey: boolean;
	isComposing: boolean;
}): boolean {
	return e.key === "Enter" && !e.shiftKey && !e.isComposing;
}

/** Whether keys typed at `target` belong to a text field, not to shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
	const element = target as HTMLElement | null;
	if (!element || typeof element.tagName !== "string") return false;
	const tag = element.tagName.toLowerCase();
	return tag === "input" || tag === "textarea" || element.isContentEditable;
}
