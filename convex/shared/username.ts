import { MIN_USERNAME_LENGTH, TEXT } from "./limits";

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
	if (username.length > TEXT.username) {
		return `Use at most ${TEXT.username} characters.`;
	}
	if (RESERVED_USERNAMES.has(username)) {
		return "This username is not available";
	}
	return null;
}
