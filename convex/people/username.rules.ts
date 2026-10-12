import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";

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
		throw new ConvexError(
			"Username must be 3–20 characters, start with a letter, and use only lowercase letters, numbers, or underscores",
		);
	}

	if (RESERVED_USERNAMES.has(username)) {
		throw new ConvexError("This username is not available");
	}

	return username;
}

const FALLBACK_USERNAME = "builder";
const BASE_MAX_LENGTH = 16;
const MAX_NUMBERED_TRIES = 9;

/** A valid, unreserved handle from the account's name, else its email's local part. */
export function buildUsernameBase(
	name: string | undefined,
	email: string | undefined,
): string {
	const source = name?.trim() ? name : (email?.split("@")[0] ?? "");
	const base = source
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^[\d_]+/, "")
		.slice(0, BASE_MAX_LENGTH)
		.replace(/_+$/, "");

	return base.length < 3 || RESERVED_USERNAMES.has(base)
		? FALLBACK_USERNAME
		: base;
}

async function isUsernameTaken(
	ctx: MutationCtx,
	username: string,
): Promise<boolean> {
	const found = await ctx.db
		.query("users")
		.withIndex("by_username", (q) => q.eq("username", username))
		.first();
	return found !== null;
}

/** The base, else `base_2` … `base_9`, else `base_` plus 4 random digits. */
export async function buildUniqueUsername(
	ctx: MutationCtx,
	name?: string,
	email?: string,
): Promise<string> {
	const base = buildUsernameBase(name, email);

	if (!(await isUsernameTaken(ctx, base))) {
		return base;
	}
	for (let n = 2; n <= MAX_NUMBERED_TRIES; n++) {
		const candidate = `${base}_${n}`;
		if (!(await isUsernameTaken(ctx, candidate))) {
			return candidate;
		}
	}
	// Leave room so the longest base still fits the 20-character limit.
	const stem = base.slice(0, 15);
	for (;;) {
		const digits = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
		const candidate = `${stem}_${digits}`;
		if (!(await isUsernameTaken(ctx, candidate))) {
			return candidate;
		}
	}
}
