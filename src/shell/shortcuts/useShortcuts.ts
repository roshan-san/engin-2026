import { useEffect, useRef } from "react";
import { findShortcut, SHORTCUTS } from "~/shell/shortcuts/registry";
import type { ShortcutContext } from "~/shell/shortcuts/registry";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** True for an input/textarea/select or any `contenteditable` element. */
export function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}
	return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

/**
 * Adds one global `keydown` listener for the registry (SHELL-05). Matching on
 * `event.key` keeps `/` and `?` distinct and means a bare `k` never opens the
 * palette (edge SHELL-05/adjacency) — only `mod+k` does. `ctx` is read from a
 * ref so the listener is attached once and always sees the latest context.
 */
export function useShortcuts(ctx: ShortcutContext) {
	const ctxRef = useRef(ctx);
	ctxRef.current = ctx;

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const current = ctxRef.current;

			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				findShortcut("palette.open")?.action(current);
				return;
			}

			if (event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}
			if (isEditableTarget(event.target)) {
				return;
			}

			const entry = SHORTCUTS.find((candidate) => candidate.key === event.key);
			if (entry) {
				event.preventDefault();
				entry.action(current);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
}
