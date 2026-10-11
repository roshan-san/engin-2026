import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { type BoardScope, boardQuery } from "./BoardScope";

const startupScope: BoardScope = {
	kind: "startup",
	startupId: "s1" as Id<"startups">,
	slug: "acme",
	userId: "u1" as Id<"users">,
	isFounder: true,
};

const builderScope: BoardScope = {
	kind: "builder",
	startupId: "s1" as Id<"startups">,
	hackathonId: "h1" as Id<"hackathons">,
	builderId: "u2" as Id<"users">,
	userId: "u1" as Id<"users">,
	isFounder: true,
	isClosed: false,
};

describe("boardQuery", () => {
	it("a Startup scope reads the Board", () => {
		expect(boardQuery(startupScope)).toEqual({
			kind: "startup",
			args: { startupId: "s1" },
		});
	});

	it("a Builder scope reads that Builder's Cards", () => {
		expect(boardQuery(builderScope)).toEqual({
			kind: "builder",
			args: { hackathonId: "h1", builderId: "u2" },
		});
	});
});
