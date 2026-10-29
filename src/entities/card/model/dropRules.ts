import type { CardAction, CardActor } from "@convex/cards/rules";
import { refusalFor } from "./cardRules";
import type { CardView } from "./types";

export type Column = "todo" | "in_progress" | "review" | "done";

export const COLUMNS: readonly { id: Column; label: string }[] = [
	{ id: "todo", label: "To do" },
	{ id: "in_progress", label: "In progress" },
	{ id: "review", label: "Review" },
	{ id: "done", label: "Done" },
];

/**
 * What dropping `card` on column `to` does: `"move"` changes its column,
 * `"ship"` opens What shipped, `null` leaves it where it is. Done only takes
 * Verify, so nothing is ever dropped there.
 */
export function dropAction(
	card: CardView,
	to: Column,
	actor: CardActor,
): "move" | "ship" | null {
	if (card.status === to || to === "done") {
		return null;
	}
	if (refusalFor(card, actionFor(to), actor) !== null) {
		return null;
	}
	return to === "review" ? "ship" : "move";
}

/** Why dropping `card` on `to` is refused, in words to show; `null` when it's fine or a no-op. */
export function dropRefusal(
	card: CardView,
	to: Column,
	actor: CardActor,
): string | null {
	if (card.status === to) return null;
	if (to === "done") return "Only Verify moves a Card to Done";
	return refusalFor(card, actionFor(to), actor);
}

/** Dropping on Review submits; on To do or In progress, moves (a Send back when it leaves Review). */
function actionFor(to: Exclude<Column, "done">): CardAction {
	return to === "review" ? { kind: "submit" } : { kind: "move", to };
}
