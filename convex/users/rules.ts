import { v } from "convex/values";

export const RESERVED_USERNAMES = new Set([
	"app",
	"admin",
	"api",
	"auth",
	"explore",
	"home",
	"invite",
	"login",
	"messages",
	"opportunities",
	"profile",
	"score",
	"settings",
	"startup",
	"startups",
	"team",
	"upgrade",
	"work",
]);

export function normalizeUsername(value: string): string {
	return value.trim().toLowerCase();
}

/**
 * What's wrong with a username, or `null` when it may be taken. It normalises first,
 * so capitals and surrounding spaces are fine.
 */
export function usernameProblem(value: string): string | null {
	const username = normalizeUsername(value);

	if (username.length < MIN_USERNAME_LENGTH) {
		return `Use at least ${MIN_USERNAME_LENGTH} characters.`;
	}
	if (!/^[a-z0-9_]+$/.test(username)) {
		return "Use only letters, numbers and _.";
	}
	if (!/^[a-z]/.test(username)) {
		return "Start with a letter.";
	}
	if (username.length > USER_TEXT.username) {
		return `Use at most ${USER_TEXT.username} characters.`;
	}
	if (RESERVED_USERNAMES.has(username)) {
		return "This username is not available";
	}
	return null;
}

export const MIN_USERNAME_LENGTH = 3;
/** Verified Cards read for a profile; more shows as "500+". */
export const MAX_PROFILE_ROWS = 500;
export const discipline = v.union(
	v.literal("engineer"),
	v.literal("designer"),
	v.literal("marketing"),
	v.literal("sales"),
	v.literal("ops"),
	v.literal("other"),
);

/** Longest allowed text per profile field. */
export const USER_TEXT = { bio: 280, username: 20 };
