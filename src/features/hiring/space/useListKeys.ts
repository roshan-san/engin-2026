import { useEffect, useRef } from "react";
import { shouldIgnoreShortcut } from "~/lib/keys";

/**
 * Keys for a list worked from the keyboard: J/K move, and each extra key
 * (lowercase) acts on the active row. Skipped while typing, with a modifier
 * held, or when a dialog or menu has focus.
 */
export function useListKeys({
	ids,
	activeId,
	onMove,
	keys,
	isEnabled,
}: {
	readonly ids: readonly string[];
	readonly activeId: string | undefined;
	readonly onMove: (id: string) => void;
	readonly keys: Readonly<Record<string, (id: string) => void>>;
	readonly isEnabled: boolean;
}) {
	// The listener stays put; it reads the latest values from here.
	const latest = useRef({ ids, activeId, onMove, keys });
	latest.current = { ids, activeId, onMove, keys };

	useEffect(() => {
		if (!isEnabled) return;

		function onKeyDown(event: KeyboardEvent) {
			if (shouldIgnoreShortcut(event)) return;

			const { ids, activeId, onMove, keys } = latest.current;
			const key = event.key.toLowerCase();
			// Enter on a button or link belongs to it.
			if (
				key === "enter" &&
				(event.target as HTMLElement | null)?.closest?.("button, a")
			) {
				return;
			}
			const index = activeId ? ids.indexOf(activeId) : -1;

			if (key === "j" || key === "k") {
				const next =
					key === "j"
						? ids[Math.min(index + 1, ids.length - 1)]
						: ids[Math.max(index - 1, 0)];
				if (next) {
					event.preventDefault();
					onMove(next);
				}
				return;
			}
			const action = keys[key];
			if (action && activeId) {
				event.preventDefault();
				action(activeId);
			}
		}

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [isEnabled]);
}
