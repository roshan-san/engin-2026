import { MIN_USERNAME_LENGTH, TEXT } from "@convex/shared/limits";
import { normalizeUsername, RESERVED_USERNAMES } from "@convex/shared/username";

/**
 * What's wrong with a username as typed, or `null` when the server would take it.
 * The server normalises first, so capitals and surrounding spaces are fine here too.
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
