import { v } from "convex/values";

/** The one list of disciplines: on profiles, Hackathons and team roles. */
export const discipline = v.union(
	v.literal("developer"),
	v.literal("designer"),
	v.literal("marketing"),
	v.literal("sales"),
	v.literal("other"),
);
