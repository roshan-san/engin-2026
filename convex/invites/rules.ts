import { v } from "convex/values";

export const MAX_INVITES = 100;
const DAY_MS = 24 * 60 * 60 * 1000;
export const INVITE_TTL_MS = 14 * DAY_MS;
export const inviteStatus = v.union(
	v.literal("pending"),
	v.literal("accepted"),
	v.literal("declined"),
	v.literal("revoked"),
);
