export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/;

export function normalizeUsername(value: string): string {
	return value.trim().toLowerCase();
}
