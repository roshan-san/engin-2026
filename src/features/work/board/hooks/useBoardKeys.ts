import { getRouteApi } from "@tanstack/react-router";
import { type RefObject, useEffect } from "react";
import { isTypingTarget } from "../keys";

const boardRoute = getRouteApi("/_shell/_authed/s/$slug/board");

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
 * across columns, Enter opens the focused Card, Esc closes it.
 */
export function useBoardKeys({
	rootRef,
	newCardRef,
	onOpen,
	isPaused,
}: {
	readonly rootRef: RefObject<HTMLElement | null>;
	readonly newCardRef: RefObject<HTMLInputElement | null>;
	readonly onOpen: (cardId: string) => void;
	/** True while a drag is in progress, so arrows steer the drag instead. */
	readonly isPaused: boolean;
}) {
	const navigate = boardRoute.useNavigate();

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const root = rootRef.current;
			if (!root || isPaused || event.defaultPrevented) return;
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			if (isTypingTarget(event.target)) return;

			if (event.key === "Escape") {
				void navigate({ search: (prev) => ({ ...prev, card: undefined }) });
				return;
			}

			const active = document.activeElement;
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

			event.preventDefault();
			target?.focus();
		}

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [rootRef, newCardRef, onOpen, isPaused, navigate]);
}
