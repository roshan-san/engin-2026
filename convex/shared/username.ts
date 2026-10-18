import { MIN_USERNAME_LENGTH, TEXT } from "./limits";

/** A letter, then lowercase letters, digits or `_`, within the length limits. */
export const USERNAME_PATTERN = new RegExp(
	`^[a-z][a-z0-9_]{${MIN_USERNAME_LENGTH - 1},${TEXT.username - 1}}$`,
);

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
