import type { Announcements } from "@dnd-kit/core";

/**
 * What a screen reader hears while a Card is dragged, in Card titles and
 * column labels rather than dnd-kit's "Draggable item c1 was moved over
 * droppable area todo". `isAccepted` says whether a column would take the Card,
 * so a refused drop isn't announced as a move.
 */
export function boardAnnouncements(
	titleOf: (cardId: string) => string,
	columnLabel: (columnId: string) => string,
	isAccepted: (cardId: string, columnId: string) => boolean,
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
			if (!over || !isAccepted(cardId, String(over.id))) {
				return `${title} dropped. Nothing moved.`;
			}
			return `${title} moved to ${columnLabel(String(over.id))}`;
		},
		onDragCancel: ({ active }) =>
			`Cancelled. ${titleOf(String(active.id))} stayed put.`,
	};
}
