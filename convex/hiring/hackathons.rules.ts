import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	DECIDE_GRACE_MS,
	MAX_BUILDERS,
	MAX_HACKATHON_CARDS,
	TEXT,
} from "../lib/limits";
import { limitText, requireLimitedText } from "../lib/text";
import { requireFounder } from "../startups/access.rules";
import { appendActivity } from "../work/activity.rules";
import { weekOf, weekStart } from "../work/cycles.rules";
import { jobMode, jobPay, jobRole } from "./hiring.schema";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** What a Founder fills in to draft a Hackathon. */
export const draftArgs = {
	job: v.object({ role: jobRole, pay: jobPay, mode: jobMode }),
	problem: v.string(),
	weeks: v.number(),
	startsAt: v.number(),
	buildersGet: v.optional(v.string()),
	cards: v.array(
		v.object({ title: v.string(), notes: v.optional(v.string()) }),
	),
};

type DraftInput = {
	job: Doc<"hackathons">["job"];
	problem: string;
	weeks: number;
	startsAt: number;
	buildersGet?: string;
	cards: { title: string; notes?: string }[];
};

/** Checks a draft and returns its normalized fields with the derived dates. */
export function requireValidDraft(input: DraftInput, now: number) {
	if (
		input.startsAt !== weekStart(weekOf(input.startsAt)) ||
		input.startsAt <= now
	) {
		throw new Error("Start on a coming Monday");
	}
	if (input.weeks !== 1 && input.weeks !== 2) {
		throw new Error("Run it for 1 or 2 weeks");
	}
	const weeks: 1 | 2 = input.weeks;
	if (input.cards.length < 1 || input.cards.length > MAX_HACKATHON_CARDS) {
		throw new Error(`Add 1–${MAX_HACKATHON_CARDS} Cards`);
	}

	const endsAt = input.startsAt + weeks * WEEK_MS;
	return {
		job: input.job,
		problem: requireLimitedText(input.problem, "Problem", TEXT.problem),
		weeks,
		startsAt: input.startsAt,
		endsAt,
		decideBy: endsAt + DECIDE_GRACE_MS,
		buildersGet: limitText(input.buildersGet, "Builders get", TEXT.buildersGet),
		cards: input.cards.map((card) => ({
			title: requireLimitedText(card.title, "Card title", TEXT.cardTitle),
			notes: limitText(card.notes, "Notes", TEXT.notes) ?? "",
		})),
	};
}

/** The Hackathon, once the person is confirmed as its Startup's Founder. */
export async function requireHackathonFounder(
	ctx: QueryCtx | MutationCtx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<Doc<"hackathons">> {
	const hackathon = await ctx.db.get(hackathonId);
	if (!hackathon) {
		throw new Error("Hackathon not found");
	}
	await requireFounder(ctx, hackathon.startupId, userId);
	return hackathon;
}

/** The Cards every Builder starts with: ownerless Cards on the Hackathon. */
export async function loadTemplateCards(
	ctx: QueryCtx | MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"cards">[]> {
	return await ctx.db
		.query("cards")
		.withIndex("by_hackathon_and_owner", (q) =>
			q.eq("hackathonId", hackathonId).eq("ownerId", undefined),
		)
		.take(MAX_HACKATHON_CARDS);
}

export async function insertTemplateCards(
	ctx: MutationCtx,
	hackathon: Pick<Doc<"hackathons">, "_id" | "startupId">,
	cards: { title: string; notes: string }[],
): Promise<void> {
	for (const card of cards) {
		await ctx.db.insert("cards", {
			startupId: hackathon.startupId,
			hackathonId: hackathon._id,
			title: card.title,
			notes: card.notes,
			status: "todo",
		});
	}
}

export async function replaceTemplateCards(
	ctx: MutationCtx,
	hackathon: Pick<Doc<"hackathons">, "_id" | "startupId">,
	cards: { title: string; notes: string }[],
): Promise<void> {
	for (const old of await loadTemplateCards(ctx, hackathon._id)) {
		await ctx.db.delete(old._id);
	}
	await insertTemplateCards(ctx, hackathon, cards);
}

/** Gives a Builder their own copy of the template Cards, once. */
export async function copyTemplateCardsTo(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
): Promise<void> {
	const existing = await ctx.db
		.query("cards")
		.withIndex("by_hackathon_and_owner", (q) =>
			q.eq("hackathonId", hackathon._id).eq("ownerId", userId),
		)
		.first();
	if (existing) {
		return;
	}
	for (const card of await loadTemplateCards(ctx, hackathon._id)) {
		await ctx.db.insert("cards", {
			startupId: hackathon.startupId,
			hackathonId: hackathon._id,
			ownerId: userId,
			title: card.title,
			notes: card.notes,
			status: "todo",
		});
	}
}

/** Builders still waiting for a decision from the Founder. */
export async function countUndecidedBuilders(
	ctx: QueryCtx | MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<number> {
	const builders = await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathonId).eq("status", "building"),
		)
		.take(MAX_BUILDERS);
	return builders.filter((builder) => !builder.decision).length;
}

/** Ends the Hackathon once every Builder has a decision. Call after each decision. */
export async function finishIfDecided(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	if (hackathon.status !== "deciding" && hackathon.status !== "building") {
		return;
	}
	const builders = await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathon._id).eq("status", "building"),
		)
		.take(MAX_BUILDERS);
	if (builders.length === 0 || builders.some((builder) => !builder.decision)) {
		return;
	}

	await ctx.db.patch(hackathon._id, { status: "done" });
	await appendActivity(ctx, {
		startupId: hackathon.startupId,
		kind: "hackathon_finished",
		at: Date.now(),
		hackathonId: hackathon._id,
	});
}
