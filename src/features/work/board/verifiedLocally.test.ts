import type { Id } from "@convex/_generated/dataModel";
import type { CardActor } from "@convex/shared/cardRules";
import { describe, expect, it } from "vitest";
import { refusalFor } from "../cardRules";
import type { CardView } from "./types";
import { verifiedLocally } from "./verifiedLocally";

const fay = "user-fay" as Id<"users">;
const sam = "user-sam" as Id<"users">;
const founder: CardActor = { userId: sam, role: "founder", phase: null };

function aCard(id: string, status: CardView["status"]) {
	return {
		_id: id as Id<"cards">,
		title: "Write welcome emails",
		notes: "",
		status,
		owner: {
			_id: fay,
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

describe("verifiedLocally", () => {
	it("a Card being verified leaves Review at once, so a second V is refused", () => {
		const [card] = verifiedLocally(
			[aCard("card-1", "review")],
			"card-1" as Id<"cards">,
			5,
		);
		expect(card?.status).toBe("done");
		expect(card?.verifiedAt).toBe(5);
		expect(
			card && refusalFor(card, { kind: "verify" }, founder),
		).not.toBeNull();
	});

	it("the other Cards on the Board stay as they were", () => {
		const other = aCard("card-2", "review");
		const [, after] = verifiedLocally(
			[aCard("card-1", "review"), other],
			"card-1" as Id<"cards">,
			5,
		);
		expect(after).toBe(other);
	});
});
