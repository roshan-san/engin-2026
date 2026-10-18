import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import {
	normalizeUsername,
	RESERVED_USERNAMES,
	usernameProblem,
} from "../shared/username";

export function requireUsername(value: string): string {
	const problem = usernameProblem(value);
	if (problem) {
		throw new ConvexError(problem);
	}
	return normalizeUsername(value);
}

const FALLBACK_USERNAME = "participant";
const BASE_MAX_LENGTH = 16;
const MAX_NUMBERED_TRIES = 9;
const MAX_RANDOM_TRIES = 20;

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

/** The base, else `base_2` … `base_9`, else `base_` plus 4 random digits (20 tries). */
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
	for (let n = 0; n < MAX_RANDOM_TRIES; n++) {
		const digits = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
		const candidate = `${stem}_${digits}`;
		if (!(await isUsernameTaken(ctx, candidate))) {
			return candidate;
		}
	}
	throw new ConvexError("Couldn't pick a username");
}
