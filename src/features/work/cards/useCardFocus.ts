import { type RefObject, useEffect, useRef } from "react";
import type { CardView } from "../board/types";

/**
 * Keyboard focus around the open Card. Opened from a keyboard-focused tile
 * (Enter), focus moves to the panel, so V still verifies it and Tab reaches the title. When the panel
 * goes (Esc, Back, close, delete) and focus has nowhere left to be, it returns
 * to that Card's tile, or its column when the Card is gone.
 */
export function useCardFocus(
	card: CardView,
	panelRef: RefObject<HTMLElement | null>,
	isDeleting: RefObject<boolean>,
) {
	const columnRef = useRef(card.status);
	columnRef.current = card.status;
	const isMounted = useRef(false);

	useEffect(() => {
		isMounted.current = true;
		const tile = document.activeElement;
		if (
			tile instanceof HTMLElement &&
			tile.dataset.cardId === card._id &&
			tile.matches(":focus-visible")
		) {
			panelRef.current?.focus();
		}
		return () => {
			isMounted.current = false;
			// After this render and any dialog's own focus return have settled.
			setTimeout(() => {
				if (isMounted.current || document.activeElement !== document.body) {
					return;
				}
				// A deleted Card's tile is about to go, so land on its column.
				const tile = isDeleting.current
					? null
					: document.querySelector<HTMLElement>(`[data-card-id="${card._id}"]`);
				const column = document.querySelector<HTMLElement>(
					`[data-column="${columnRef.current}"]`,
				);
				(tile ?? column)?.focus();
			}, 0);
		};
	}, [card._id, panelRef, isDeleting]);
}
