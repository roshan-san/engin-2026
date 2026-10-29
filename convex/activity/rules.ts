import { v } from "convex/values";

export const activityKind = v.union(
	v.literal("card_verified"),
	v.literal("contributor_joined"),
	v.literal("hackathon_finished"),
	v.literal("participant_hired"),
);
