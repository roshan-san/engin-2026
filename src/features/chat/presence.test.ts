import { describe, expect, it } from "vitest";
import { orderPresence, presenceLabel } from "./presence";

const person = (id: string, name: string | null = id) => ({
	_id: id,
	name,
	username: null,
});
const entry = (id: string, name: string | null = id) => ({
	user: person(id, name),
	workingOn: null,
});

describe("orderPresence", () => {
	it("puts the viewer first and keeps everyone else's order", () => {
		const entries = [entry("sam"), entry("fay"), entry("ada")];

		const ordered = orderPresence(entries, "fay");

		expect(ordered.map((e) => e.user._id)).toEqual(["fay", "sam", "ada"]);
	});

	it("lists a person once when they have several tabs open", () => {
		const entries = [entry("sam"), entry("fay"), entry("sam")];

		const ordered = orderPresence(entries, "fay");

		expect(ordered.map((e) => e.user._id)).toEqual(["fay", "sam"]);
	});

	it("leaves the order alone when the viewer isn't online", () => {
		const entries = [entry("sam"), entry("ada")];

		const ordered = orderPresence(entries, "fay");

		expect(ordered.map((e) => e.user._id)).toEqual(["sam", "ada"]);
	});
});

describe("presenceLabel", () => {
	it("is the name when they have no Card in progress", () => {
		expect(presenceLabel(entry("sam", "Sam"))).toBe("Sam");
	});

	it("adds the Card they are working on", () => {
		const sam = {
			...entry("sam", "Sam"),
			workingOn: { cardId: "c1", title: "Onboarding emails" },
		};

		expect(presenceLabel(sam)).toBe("Sam · In progress · Onboarding emails");
	});
});
