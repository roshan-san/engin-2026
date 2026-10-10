import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { dropAction } from "./dropRules";
import type { CardView } from "./types";

const fay = "user-fay" as Id<"users">;
const sam = "user-sam" as Id<"users">;

function aCard(status: CardView["status"], ownerId: Id<"users"> = fay) {
	return {
		_id: "card-1" as Id<"cards">,
		title: "Write welcome emails",
		notes: "",
		status,
		owner: { _id: ownerId, name: null, username: null, image: null },
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

const owner = { userId: fay, isFounder: false };
const founder = { userId: sam, isFounder: true };

describe("dropAction", () => {
	it("ships a Card its owner drops on Review", () => {
		expect(dropAction(aCard("in_progress"), "review", owner)).toBe("ship");
		expect(dropAction(aCard("todo"), "review", owner)).toBe("ship");
	});

	it("does nothing when someone else drops a Card on Review", () => {
		expect(dropAction(aCard("in_progress"), "review", founder)).toBeNull();
	});

	it("does nothing when a Contributor drops a Card out of Review", () => {
		const card = aCard("review");

		expect(dropAction(card, "todo", owner)).toBeNull();
		expect(dropAction(card, "in_progress", owner)).toBeNull();
	});

	it("lets the Founder send a Card back from Review", () => {
		const card = aCard("review");

		expect(dropAction(card, "todo", founder)).toBe("move");
		expect(dropAction(card, "in_progress", founder)).toBe("move");
	});

	it("never moves a Card to Done", () => {
		expect(dropAction(aCard("review"), "done", founder)).toBeNull();
		expect(dropAction(aCard("in_progress"), "done", owner)).toBeNull();
	});

	it("moves a Card between To do and In progress", () => {
		expect(dropAction(aCard("todo"), "in_progress", owner)).toBe("move");
		expect(dropAction(aCard("in_progress"), "todo", owner)).toBe("move");
	});

	it("does nothing when a Card is dropped where it already is", () => {
		expect(dropAction(aCard("todo"), "todo", owner)).toBeNull();
	});

	it("never moves a Card out of Done", () => {
		expect(dropAction(aCard("done"), "todo", founder)).toBeNull();
		expect(dropAction(aCard("done"), "review", founder)).toBeNull();
	});
});
