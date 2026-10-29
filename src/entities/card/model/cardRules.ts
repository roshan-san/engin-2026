import {
	type CardAction,
	type CardActor,
	cardRefusal,
	submitLandsIn,
} from "@convex/cards/rules";
import type { CardView } from "./types";

/** `cardRefusal` for a Card as the browser sees it: `null` when `actor` may do `action`. */
export function refusalFor(
	card: CardView,
	action: CardAction,
	actor: CardActor,
): string | null {
	return cardRefusal(ruled(card), action, actor);
}

/** Where submitting this Card lands it. */
export function landsIn(card: CardView, actor: CardActor): "review" | "done" {
	return submitLandsIn(ruled(card), actor);
}

function ruled(card: CardView) {
	return { status: card.status, ownerId: card.owner?._id };
}
