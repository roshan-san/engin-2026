import type { Id } from "@convex/_generated/dataModel";
import type { CardActor } from "@convex/cards/rules";
import { describe, expect, it } from "vitest";
import { dropAction, dropRefusal } from "./dropRules";
import type { CardView } from "./types";

const fay = "user-fay" as Id<"users">;
const sam = "user-sam" as Id<"users">;

function aCard(status: CardView["status"], ownerId: Id<"users"> = fay) {
	return {
		_id: "card-1" as Id<"cards">,
		title: "Write welcome emails",
		notes: "",
		status,
		owner: {
			_id: ownerId,
			name: null,
			username: null,
			image: null,
			rating: 1000,
		},
		shipped: null,
		submittedAt: null,
		verifiedAt: null,
		verifiedBy: null,
		notesEditedAt: null,
		notesEditedBy: null,
		changesAsked: false,
		selfVerified: false,
	} satisfies CardView;
}

const owner: CardActor = { userId: fay, role: "contributor", phase: null };
const founder: CardActor = { userId: sam, role: "founder", phase: null };

describe("dropAction", () => {
	it("a drop on Review opens What shipped", () => {
		expect(dropAction(aCard("in_progress"), "review", owner)).toBe("ship");
	});

	it("a drop on To do or In progress moves the Card", () => {
		expect(dropAction(aCard("todo"), "in_progress", owner)).toBe("move");
		expect(dropAction(aCard("review"), "todo", founder)).toBe("move");
	});

	it("nothing is ever dropped on Done", () => {
		expect(dropAction(aCard("review"), "done", founder)).toBeNull();
	});

	it("a drop where the Card already is does nothing", () => {
		expect(dropAction(aCard("todo"), "todo", owner)).toBeNull();
	});

	it("a drop the Card rules refuse does nothing", () => {
		expect(dropAction(aCard("in_progress"), "review", founder)).toBeNull();
	});
});

describe("dropRefusal", () => {
	it("says Done only takes Verify", () => {
		expect(dropRefusal(aCard("review"), "done", founder)).toBe(
			"Only Verify moves a Card to Done",
		);
	});

	it("gives the Card rules' reason for a refused drop", () => {
		expect(dropRefusal(aCard("review"), "todo", owner)).toBe(
			"Only the Founder can send a Card back",
		);
	});

	it("is silent for allowed drops and drops where the Card already is", () => {
		expect(dropRefusal(aCard("in_progress"), "review", owner)).toBeNull();
		expect(dropRefusal(aCard("todo"), "todo", owner)).toBeNull();
	});
});
