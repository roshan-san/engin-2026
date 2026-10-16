import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { type BoardScope, boardQuery } from "./BoardScope";

const startupScope: BoardScope = {
	kind: "startup",
	startupId: "s1" as Id<"startups">,
	slug: "acme",
	userId: "u1" as Id<"users">,
	role: "founder",
	phase: null,
};

const participantScope: BoardScope = {
	kind: "participant",
	hackathonId: "h1" as Id<"hackathons">,
	participantId: "u2" as Id<"users">,
	userId: "u1" as Id<"users">,
	role: "founder",
	phase: "live",
};

describe("boardQuery", () => {
	it("a Startup scope reads the Board", () => {
		expect(boardQuery(startupScope)).toEqual({
			kind: "startup",
			args: { startupId: "s1" },
		});
	});

	it("a Participant scope reads that Participant's Cards", () => {
		expect(boardQuery(participantScope)).toEqual({
			kind: "participant",
			args: { hackathonId: "h1", participantId: "u2" },
		});
	});
});
