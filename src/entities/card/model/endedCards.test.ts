import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { hideEndedCards } from "./endedCards";
import type { CardView } from "./types";

const card = (id: string, status: CardView["status"], week: string | null) =>
	({ _id: id as Id<"cards">, status, week }) as unknown as CardView;

describe("hideEndedCards", () => {
	it("hides last week's unfinished Cards as soon as the week turns", () => {
		const cards = [
			card("old", "todo", "2026-W44"),
			card("working", "in_progress", "2026-W44"),
			card("waiting", "review", "2026-W44"),
			card("new", "todo", "2026-W45"),
		];

		expect(hideEndedCards(cards, "2026-W45").map((c) => c._id)).toEqual([
			"waiting",
			"new",
		]);
	});

	it("shows everything until the planning week is known", () => {
		const cards = [card("old", "todo", "2026-W44")];

		expect(hideEndedCards(cards, undefined)).toEqual(cards);
	});
});
