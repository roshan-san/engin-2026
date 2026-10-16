import type { Id } from "@convex/_generated/dataModel";
import type { CardView } from "./types";

export type Column = "todo" | "in_progress" | "review" | "done";

export const COLUMNS: readonly { id: Column; label: string }[] = [
	{ id: "todo", label: "To do" },
	{ id: "in_progress", label: "In progress" },
	{ id: "review", label: "Review" },
	{ id: "done", label: "Done" },
];

type Viewer = { userId: Id<"users">; isFounder: boolean };

/**
 * What dropping `card` on column `to` does: `"move"` changes its column,
 * `"ship"` opens What shipped, `null` leaves it where it is. Done only takes
 * Verify, so nothing is ever dropped there.
 */
export function dropAction(
	card: CardView,
	to: Column,
	viewer: Viewer,
): "move" | "ship" | null {
	if (card.status === to || to === "done" || card.status === "done") {
		return null;
	}
	if (to === "review") {
		return card.owner?._id === viewer.userId ? "ship" : null;
	}
	if (card.status === "review") {
		return viewer.isFounder ? "move" : null;
	}
	return "move";
}

/** Why dropping `card` on `to` is refused, in words to show; `null` when it's fine or a no-op. */
export function dropRefusal(
	card: CardView,
	to: Column,
	viewer: Viewer,
): string | null {
	if (card.status === to || card.status === "done") return null;
	if (dropAction(card, to, viewer) !== null) return null;
	if (to === "done") return "Only Verify moves a Card to Done";
	if (to === "review") return "Only the Card's owner can submit it";
	if (card.status === "review") return "Only the Founder can send a Card back";
	return null;
}
