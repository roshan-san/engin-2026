import { describe, expect, it } from "vitest";
import { cycleCardOrder } from "./cycleCardOrder";

describe("cycleCardOrder", () => {
	it("puts what's moving first and Done last", () => {
		const cards = [
			{ status: "done" },
			{ status: "todo" },
			{ status: "review" },
			{ status: "in_progress" },
		] as const;

		expect(cycleCardOrder(cards).map((card) => card.status)).toEqual([
			"in_progress",
			"review",
			"todo",
			"done",
		]);
	});

	it("keeps the order within a status", () => {
		const cards = [
			{ status: "todo", title: "a" },
			{ status: "in_progress", title: "b" },
			{ status: "todo", title: "c" },
		] as const;

		expect(cycleCardOrder(cards).map((card) => card.title)).toEqual([
			"b",
			"a",
			"c",
		]);
	});
});
