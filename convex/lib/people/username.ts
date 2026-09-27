const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/;

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

export function normalizeUsername(value: string): string {
	return value.trim().toLowerCase();
}

export function requireUsername(value: string): string {
	const username = normalizeUsername(value);

	if (!USERNAME_PATTERN.test(username)) {
		throw new Error(
			"Username must be 3–20 characters, start with a letter, and use only lowercase letters, numbers, or underscores",
		);
	}

	if (RESERVED_USERNAMES.has(username)) {
		throw new Error("This username is not available");
	}

	return username;
}
