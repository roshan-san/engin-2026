import { v } from "convex/values";

export const MAX_THREADS = 20;
export const threadKind = v.union(
	v.literal("team"),
	v.literal("everyone"),
	v.literal("private"),
);
