/**
 * The username rule, mirroring `requireUsername` in `convex/model/username.ts`
 * (the server owns it; `convex/shared/` doesn't export it). The server trims and
 * lowercases first, so capitals and surrounding spaces are fine here too.
 */
const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

const RESERVED_USERNAMES = new Set([
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

/** What's wrong with a username as typed, or `null` when the server would take it. */
export function usernameProblem(value: string): string | null {
	const username = value.trim().toLowerCase();

	if (username.length < MIN_LENGTH) {
		return `Use at least ${MIN_LENGTH} characters.`;
	}
	if (!/^[a-z0-9_]+$/.test(username)) {
		return "Use only letters, numbers and _.";
	}
	if (!/^[a-z]/.test(username)) {
		return "Start with a letter.";
	}
	if (username.length > MAX_LENGTH) {
		return `Use at most ${MAX_LENGTH} characters.`;
	}
	if (RESERVED_USERNAMES.has(username)) {
		return "This username is not available";
	}
	return null;
}
