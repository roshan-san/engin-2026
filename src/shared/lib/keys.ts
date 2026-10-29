/**
 * Plain Enter sends; Shift+Enter is a newline and an IME's Enter just confirms text.
 * On a touch screen (`coarse`) Enter is a newline too, and the Send button sends;
 * Cmd/Ctrl+Enter still sends there, for a tablet with a hardware keyboard.
 */
export function isSendKey(
	e: {
		key: string;
		shiftKey: boolean;
		isComposing: boolean;
		metaKey?: boolean;
		ctrlKey?: boolean;
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
		(!options?.coarse || e.metaKey === true || e.ctrlKey === true)
	);
}

/**
 * Whether a page shortcut should leave this key alone: something handled it already,
 * a modifier is held, you're typing in a field, or a dialog, list or menu has focus
 * (they own their keys; the page is behind them).
 */
export function shouldIgnoreShortcut(event: {
	readonly defaultPrevented: boolean;
	readonly ctrlKey: boolean;
	readonly metaKey: boolean;
	readonly altKey: boolean;
	readonly target: EventTarget | null;
}): boolean {
	if (event.defaultPrevented) return true;
	if (event.ctrlKey || event.metaKey || event.altKey) return true;
	const element = event.target as HTMLElement | null;
	if (!element || typeof element.tagName !== "string") return false;
	const tag = element.tagName.toLowerCase();
	if (tag === "input" || tag === "textarea" || element.isContentEditable) {
		return true;
	}
	return (
		element.closest(
			"[role=dialog], [role=alertdialog], [role=listbox], [role=menu]",
		) !== null
	);
}
