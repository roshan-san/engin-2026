import { v } from "convex/values";

export const MAX_USER_STARTUPS = 50;
export const startupStage = v.union(
	v.literal("idea"),
	v.literal("building"),
	v.literal("launched"),
	v.literal("earning"),
);
export const startupCategory = v.union(
	v.literal("saas"),
	v.literal("consumer"),
	v.literal("fintech"),
	v.literal("d2c"),
	v.literal("ai"),
	v.literal("marketplace"),
	v.literal("other"),
);
export const startupCity = v.union(
	v.literal("bengaluru"),
	v.literal("delhi_ncr"),
	v.literal("mumbai"),
	v.literal("hyderabad"),
	v.literal("pune"),
	v.literal("chennai"),
	v.literal("remote"),
	v.literal("other"),
);

/** Longest allowed text per Startup field. */
export const STARTUP_TEXT = { name: 60, oneLiner: 140, problem: 2000 };
