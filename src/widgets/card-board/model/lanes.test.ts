import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import type { CardView } from "~/entities/card";
import type { TeamPeople } from "~/entities/contributor";
import {
	groupIntoLanes,
	laneDropId,
	parseLaneDropId,
	resolveDrop,
} from "./lanes";

const fay = "user-fay" as Id<"users">;
const ravi = "user-ravi" as Id<"users">;
const meera = "user-meera" as Id<"users">;

const person = (_id: Id<"users">, name: string) => ({
	_id,
	name,
	username: null,
	image: null,
	momentum: 1000,
	momentumChange: 0,
	isProvisional: true,
});

const team = {
	founder: person(fay, "Fay"),
	contributors: [
		{ ...person(ravi, "Ravi"), discipline: "developer", label: null },
		{ ...person(meera, "Meera"), discipline: "marketing", label: "Growth" },
	],
} as unknown as TeamPeople;

const card = (id: string, ownerId: Id<"users"> | null) =>
	({
		_id: id,
		owner: ownerId ? { _id: ownerId } : null,
	}) as unknown as CardView;

describe("groupIntoLanes", () => {
	it("gives each person a lane, the Founder first, with their Cards", () => {
		const lanes = groupIntoLanes(
			[card("c1", ravi), card("c2", fay), card("c3", ravi)],
			team,
		);

		expect(
			lanes.map(({ id, name, role, cards }) => ({
				id,
				name,
				role,
				cards: cards.map((c) => c._id),
			})),
		).toEqual([
			{ id: fay, name: "Fay", role: "Founder", cards: ["c2"] },
			{ id: ravi, name: "Ravi", role: "Developer", cards: ["c1", "c3"] },
			{ id: meera, name: "Meera", role: "Marketing · Growth", cards: [] },
		]);
	});

	it("adds a last lane for Cards nobody owns", () => {
		const lanes = groupIntoLanes([card("c1", null)], team);

		expect(lanes.at(-1)).toMatchObject({
			id: "none",
			ownerId: null,
			name: "No owner",
		});
		expect(lanes.at(-1)?.cards.map((c) => c._id)).toEqual(["c1"]);
	});
});

describe("lane drop ids", () => {
	it("carry the lane and the column", () => {
		expect(parseLaneDropId(laneDropId("u1", "in_progress"))).toEqual({
			laneId: "u1",
			column: "in_progress",
		});
		expect(parseLaneDropId("todo")).toBeNull();
		expect(parseLaneDropId("u1:nowhere")).toBeNull();
	});
});

describe("resolveDrop", () => {
	const lanes = groupIntoLanes([card("c1", ravi), card("c2", null)], team);

	it("a drop in the Card's own lane lands in that column", () => {
		expect(
			resolveDrop(laneDropId(ravi, "in_progress"), card("c1", ravi), lanes),
		).toEqual({ column: "in_progress", otherLane: false });
		expect(
			resolveDrop(laneDropId("none", "todo"), card("c2", null), lanes),
		).toEqual({ column: "todo", otherLane: false });
	});

	it("a drop in another lane is marked, so the Board can refuse it", () => {
		expect(
			resolveDrop(laneDropId(fay, "todo"), card("c1", ravi), lanes),
		).toEqual({ column: "todo", otherLane: true });
	});

	it("a plain column id works on a Board without lanes", () => {
		expect(resolveDrop("review", card("c1", ravi), null)).toEqual({
			column: "review",
			otherLane: false,
		});
		expect(resolveDrop("nowhere", card("c1", ravi), null)).toBeNull();
	});
});
