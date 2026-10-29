import type { Id } from "../_generated/dataModel";
import type { HackathonPhase } from "../hackathons/rules";

export type CardRole = "founder" | "contributor" | "participant";

/** Who is acting. `phase` is the Hackathon's for a Hackathon Card, `null` for a Startup Card. */
export type CardActor = {
	userId: Id<"users">;
	role: CardRole;
	phase: HackathonPhase | null;
};

export type RuledCard = {
	status: "todo" | "in_progress" | "review" | "done";
	ownerId?: Id<"users">;
};

/** A move out of Review is a Send back. Review and Done are reached by `submit` and `verify`. */
export type CardAction =
	| { kind: "move"; to: "todo" | "in_progress" }
	| { kind: "submit" }
	| { kind: "verify" }
	| { kind: "delete" }
	| { kind: "retitle" }
	| { kind: "reassign" }
	| { kind: "editNotes" };

const VERIFIED = "This Card is verified, so only its notes can change";
const STAYS_WITH_PARTICIPANT = "Hackathon Cards stay with their Participant";

/** Why `actor` may not do `action` to `card`, in words to show; `null` when they may. */
export function cardRefusal(
	card: RuledCard,
	action: CardAction,
	actor: CardActor,
): string | null {
	const locked = hackathonRefusal(card, actor);
	if (locked) {
		return locked;
	}
	const isHackathonCard = actor.phase !== null;
	switch (action.kind) {
		case "editNotes":
			return null;
		case "verify":
			if (actor.role !== "founder") {
				return "Only the Founder can verify a Card";
			}
			return card.status === "review" ? null : "This Card isn't in Review";
		case "retitle":
			return card.status === "done" ? VERIFIED : null;
		case "move":
			if (card.status === "done") {
				return VERIFIED;
			}
			return card.status === "review" && actor.role !== "founder"
				? "Only the Founder can send a Card back"
				: null;
		case "submit":
			if (card.ownerId !== actor.userId) {
				return "Only the Card's owner can submit it";
			}
			if (card.status === "done") {
				return VERIFIED;
			}
			return card.status === "review" ? "This Card is already in Review" : null;
		case "reassign":
			if (card.status === "done") {
				return VERIFIED;
			}
			if (isHackathonCard) {
				return STAYS_WITH_PARTICIPANT;
			}
			// Verifying credits the owner, so the owner is fixed once submitted.
			return card.status === "review"
				? "The owner is fixed once a Card is in Review"
				: null;
		case "delete":
			if (card.status === "done") {
				return VERIFIED;
			}
			if (isHackathonCard) {
				return STAYS_WITH_PARTICIPANT;
			}
			return actor.role === "founder" || card.ownerId === actor.userId
				? null
				: "Only the owner or the Founder can delete this Card";
	}
}

/** Where a submitted Card lands: the Founder's own goes straight to Done, self-verified. */
export function submitLandsIn(
	card: RuledCard,
	actor: CardActor,
): "review" | "done" {
	return actor.role === "founder" && card.ownerId === actor.userId
		? "done"
		: "review";
}

/** On a Hackathon Card, Participants work only their own while Live; the Founder works any until Done. */
function hackathonRefusal(card: RuledCard, actor: CardActor): string | null {
	if (actor.phase === null) {
		return null;
	}
	switch (actor.role) {
		case "founder":
			return actor.phase === "done" ? "This Hackathon has ended" : null;
		case "participant":
			if (card.ownerId !== actor.userId) {
				return "This Card isn't yours";
			}
			return actor.phase === "live" ? null : "This Hackathon isn't running";
		case "contributor":
			return "This Card isn't yours";
	}
}
