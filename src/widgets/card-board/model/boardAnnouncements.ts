import type { Announcements } from "@dnd-kit/core";

/**
 * What a screen reader hears while a Card is dragged, in Card titles and
 * column labels rather than dnd-kit's "Draggable item c1 was moved over
 * droppable area todo". `dropOf` says what a drop on a column does, so a
 * refused drop isn't announced as a move, and a drop on Review, which opens
 * What shipped first, isn't announced as moved yet.
 */
export function boardAnnouncements(
	titleOf: (cardId: string) => string,
	columnLabel: (columnId: string) => string,
	dropOf: (cardId: string, columnId: string) => "move" | "ship" | null,
): Announcements {
	return {
		onDragStart: ({ active }) => `Picked up ${titleOf(String(active.id))}`,
		onDragOver: ({ active, over }) => {
			const title = titleOf(String(active.id));
			return over
				? `${title} is over ${columnLabel(String(over.id))}`
				: `${title} is not over a column`;
		},
		onDragEnd: ({ active, over }) => {
			const cardId = String(active.id);
			const title = titleOf(cardId);
			const drop = over ? dropOf(cardId, String(over.id)) : null;
			if (!over || drop === null) {
				return `${title} dropped. Nothing moved.`;
			}
			const label = columnLabel(String(over.id));
			return drop === "ship"
				? `${title}: say what shipped to move it to ${label}`
				: `${title} moved to ${label}`;
		},
		onDragCancel: ({ active }) =>
			`Cancelled. ${titleOf(String(active.id))} stayed put.`,
	};
}
