import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import type { HackathonPhase } from "../hackathons/rules";
import {
	type CardAction,
	type CardActor,
	cardRefusal,
	type RuledCard,
	submitLandsIn,
} from "./rules";

const fay = "user-fay" as Id<"users">;
const lee = "user-lee" as Id<"users">;
const sam = "user-sam" as Id<"users">;

const founder: CardActor = { userId: sam, role: "founder", phase: null };
const contributor: CardActor = {
	userId: fay,
	role: "contributor",
	phase: null,
};
const participant = (phase: HackathonPhase): CardActor => ({
	userId: fay,
	role: "participant",
	phase,
});
const hackathonFounder = (phase: HackathonPhase): CardActor => ({
	userId: sam,
	role: "founder",
	phase,
});

const card = (
	status: RuledCard["status"],
	ownerId: Id<"users"> = fay,
): RuledCard => ({ status, ownerId });

const MOVE: CardAction = { kind: "move", to: "in_progress" };
const SEND_BACK: CardAction = { kind: "move", to: "todo" };
const SUBMIT: CardAction = { kind: "submit" };
const VERIFY: CardAction = { kind: "verify" };
const DELETE: CardAction = { kind: "delete" };
const RETITLE: CardAction = { kind: "retitle" };
const REASSIGN: CardAction = { kind: "reassign" };
const EDIT_NOTES: CardAction = { kind: "editNotes" };

const VERIFIED = "This Card is verified, so only its notes can change";
const STAYS = "Hackathon Cards stay with their Participant";

describe("Startup Cards", () => {
	it("anyone on the team moves, retitles, reassigns and edits notes on any open Card", () => {
		for (const actor of [founder, contributor]) {
			for (const action of [MOVE, RETITLE, REASSIGN, EDIT_NOTES]) {
				expect(cardRefusal(card("todo", lee), action, actor)).toBeNull();
			}
		}
	});

	it("only the owner submits", () => {
		expect(cardRefusal(card("in_progress"), SUBMIT, contributor)).toBeNull();
		expect(cardRefusal(card("in_progress", lee), SUBMIT, contributor)).toBe(
			"Only the Card's owner can submit it",
		);
		expect(cardRefusal(card("in_progress"), SUBMIT, founder)).toBe(
			"Only the Card's owner can submit it",
		);
	});

	it("a Card in Review can't be submitted again", () => {
		expect(cardRefusal(card("review"), SUBMIT, contributor)).toBe(
			"This Card is already in Review",
		);
	});

	it("only the Founder sends a Card back from Review", () => {
		expect(cardRefusal(card("review"), SEND_BACK, founder)).toBeNull();
		expect(cardRefusal(card("review"), SEND_BACK, contributor)).toBe(
			"Only the Founder can send a Card back",
		);
	});

	it("only the Founder verifies, and only a Card in Review", () => {
		expect(cardRefusal(card("review"), VERIFY, founder)).toBeNull();
		expect(cardRefusal(card("review"), VERIFY, contributor)).toBe(
			"Only the Founder can verify a Card",
		);
		expect(cardRefusal(card("in_progress"), VERIFY, founder)).toBe(
			"This Card isn't in Review",
		);
		expect(cardRefusal(card("done"), VERIFY, founder)).toBe(
			"This Card isn't in Review",
		);
	});

	it("the owner or the Founder deletes", () => {
		expect(cardRefusal(card("todo"), DELETE, contributor)).toBeNull();
		expect(cardRefusal(card("todo", lee), DELETE, founder)).toBeNull();
		expect(cardRefusal(card("todo", lee), DELETE, contributor)).toBe(
			"Only the owner or the Founder can delete this Card",
		);
	});

	it("the owner is fixed once a Card is in Review", () => {
		expect(cardRefusal(card("review"), REASSIGN, founder)).toBe(
			"The owner is fixed once a Card is in Review",
		);
		expect(cardRefusal(card("review"), RETITLE, contributor)).toBeNull();
	});

	it("a verified Card only takes notes", () => {
		for (const action of [MOVE, SEND_BACK, RETITLE, REASSIGN, DELETE]) {
			expect(cardRefusal(card("done"), action, founder)).toBe(VERIFIED);
		}
		expect(cardRefusal(card("done", fay), SUBMIT, contributor)).toBe(VERIFIED);
		expect(cardRefusal(card("done"), EDIT_NOTES, contributor)).toBeNull();
	});
});

describe("Hackathon Cards", () => {
	it("a Participant works their own Cards while the Hackathon is live", () => {
		for (const action of [MOVE, RETITLE, EDIT_NOTES, SUBMIT]) {
			expect(cardRefusal(card("todo"), action, participant("live"))).toBeNull();
		}
	});

	it.each<HackathonPhase>(["open", "deciding", "done"])(
		"a Participant can't work their Cards while the Hackathon is %s",
		(phase) => {
			for (const action of [MOVE, RETITLE, EDIT_NOTES, SUBMIT]) {
				expect(cardRefusal(card("todo"), action, participant(phase))).toBe(
					"This Hackathon isn't running",
				);
			}
		},
	);

	it("a Participant can't work someone else's Cards", () => {
		expect(cardRefusal(card("todo", lee), MOVE, participant("live"))).toBe(
			"This Card isn't yours",
		);
	});

	it("a Participant can't send back or verify their own Card", () => {
		expect(cardRefusal(card("review"), SEND_BACK, participant("live"))).toBe(
			"Only the Founder can send a Card back",
		);
		expect(cardRefusal(card("review"), VERIFY, participant("live"))).toBe(
			"Only the Founder can verify a Card",
		);
	});

	it.each<HackathonPhase>(["live", "deciding"])(
		"the Founder moves, retitles, edits notes, sends back and verifies while %s",
		(phase) => {
			const actor = hackathonFounder(phase);
			for (const action of [MOVE, RETITLE, EDIT_NOTES]) {
				expect(cardRefusal(card("in_progress"), action, actor)).toBeNull();
			}
			expect(cardRefusal(card("review"), SEND_BACK, actor)).toBeNull();
			expect(cardRefusal(card("review"), VERIFY, actor)).toBeNull();
		},
	);

	it("the Founder stops once the Hackathon is done", () => {
		for (const action of [MOVE, RETITLE, EDIT_NOTES, VERIFY]) {
			expect(
				cardRefusal(card("review"), action, hackathonFounder("done")),
			).toBe("This Hackathon has ended");
		}
	});

	it("nobody reassigns or deletes a Hackathon Card", () => {
		for (const actor of [participant("live"), hackathonFounder("live")]) {
			expect(cardRefusal(card("todo"), REASSIGN, actor)).toBe(STAYS);
			expect(cardRefusal(card("todo"), DELETE, actor)).toBe(STAYS);
		}
	});

	it("a Contributor can't touch a Hackathon Card", () => {
		const actor: CardActor = { ...contributor, phase: "live" };
		expect(cardRefusal(card("todo"), MOVE, actor)).toBe(
			"This Card isn't yours",
		);
	});
});

describe("submitLandsIn", () => {
	it("the Founder's own Card goes straight to Done", () => {
		expect(submitLandsIn(card("in_progress", sam), founder)).toBe("done");
	});

	it("everyone else's Card goes to Review", () => {
		expect(submitLandsIn(card("in_progress"), contributor)).toBe("review");
		expect(submitLandsIn(card("in_progress"), participant("live"))).toBe(
			"review",
		);
	});
});
