import { type RefObject, useEffect } from "react";
import { shouldIgnoreShortcut } from "~/lib/keys";

const NEXT = new Set(["j", "ArrowDown"]);
const PREVIOUS = new Set(["k", "ArrowUp"]);

function tilesIn(root: HTMLElement) {
	return Array.from(root.querySelectorAll<HTMLElement>("[data-column]")).map(
		(column) =>
			Array.from(column.querySelectorAll<HTMLElement>("[data-card-id]")),
	);
}

/**
 * Board shortcuts: C new Card, J/K or Up/Down within a column, Left/Right
 * across columns, Enter opens the focused Card, Esc closes it. V verifies the
 * Card open in the panel; on a focused tile whose Card isn't open, it opens
 * that Card instead, so nothing is verified unseen.
 */
export function useBoardKeys({
	rootRef,
	newCardRef,
	openCardId,
	onOpen,
	onClose,
	onVerify,
	isPaused,
}: {
	readonly rootRef: RefObject<HTMLElement | null>;
	readonly newCardRef: RefObject<HTMLElement | null>;
	readonly openCardId: string | undefined;
	readonly onOpen: (cardId: string) => void;
	readonly onClose: () => void;
	readonly onVerify: (cardId: string) => void;
	/** True while a drag is in progress, so arrows steer the drag instead. */
	readonly isPaused: boolean;
}) {
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const root = rootRef.current;
			if (!root || isPaused || shouldIgnoreShortcut(event)) return;

			if (event.key === "Escape") {
				onClose();
				return;
			}

			const active = document.activeElement;

			if (event.key === "v" || event.key === "V") {
				// Holding V would open a Card and then verify it unseen.
				if (event.repeat) return;
				const focusedId =
					active?.closest<HTMLElement>("[data-card-id]")?.dataset.cardId;
				if (focusedId && focusedId !== openCardId) {
					event.preventDefault();
					onOpen(focusedId);
				} else if (openCardId) {
					event.preventDefault();
					onVerify(openCardId);
				}
				return;
			}

			const isOnBoard =
				active === document.body || (active && root.contains(active));
			if (!isOnBoard) return;

			if (event.key === "c" || event.key === "C") {
				event.preventDefault();
				newCardRef.current?.focus();
				return;
			}

			const columns = tilesIn(root);
			const focused = active?.closest<HTMLElement>("[data-card-id]") ?? null;

			if (event.key === "Enter") {
				const cardId = focused?.dataset.cardId;
				if (focused === active && cardId) {
					event.preventDefault();
					onOpen(cardId);
				}
				return;
			}

			const columnIndex = columns.findIndex((tiles) =>
				focused ? tiles.includes(focused) : false,
			);
			const tileIndex = focused
				? (columns[columnIndex]?.indexOf(focused) ?? 0)
				: 0;

			let target: HTMLElement | undefined;
			if (NEXT.has(event.key) || PREVIOUS.has(event.key)) {
				if (!focused) {
					target = columns.find((tiles) => tiles.length > 0)?.[0];
				} else {
					const step = NEXT.has(event.key) ? 1 : -1;
					target = columns[columnIndex]?.[tileIndex + step];
				}
			} else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
				const step = event.key === "ArrowRight" ? 1 : -1;
				if (!focused) {
					target = columns.find((tiles) => tiles.length > 0)?.[0];
				} else {
					for (
						let index = columnIndex + step;
						index >= 0 && index < columns.length;
						index += step
					) {
						const tiles = columns[index] ?? [];
						if (tiles.length > 0) {
							target = tiles[Math.min(tileIndex, tiles.length - 1)];
							break;
						}
					}
				}
			} else {
				return;
			}

			if (!target) return;
			event.preventDefault();
			target.focus();
		}

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [rootRef, newCardRef, onOpen, onClose, onVerify, openCardId, isPaused]);
}
