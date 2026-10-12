import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	DECIDE_GRACE_MS,
	MAX_APPLICATIONS,
	MAX_BUILDERS,
	MAX_HACKATHON_CARDS,
	MIN_HACKATHON_CARDS,
	TEXT,
} from "../shared/limits";
import { limitText, requireLimitedText } from "./text";
import { requireFounder } from "./teamAccess";
import { appendActivity } from "./activity";
import { WEEK_MS, weekOf, weekStart } from "../shared/cycles";
import { jobMode, jobPay, jobRole } from "../shared/validators";
import type { HiringRecord } from "./hiringRecord";

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
		throw new ConvexError("Start on a coming Monday");
	}
	if (input.weeks !== 1 && input.weeks !== 2) {
		throw new ConvexError("Run it for 1 or 2 weeks");
	}
	const weeks: 1 | 2 = input.weeks;
	if (
		input.cards.length < MIN_HACKATHON_CARDS ||
		input.cards.length > MAX_HACKATHON_CARDS
	) {
		throw new ConvexError(
			`Add ${MIN_HACKATHON_CARDS}–${MAX_HACKATHON_CARDS} Cards`,
		);
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
		throw new ConvexError("Hackathon not found");
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

/**
 * Declines up to one batch of applicants still `applied`. Applications are
 * unlimited, so returns true when the batch was full and more may remain.
 */
export async function declineAppliedBatch(
	ctx: MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<boolean> {
	const applied = await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathonId).eq("status", "applied"),
		)
		.take(MAX_APPLICATIONS);
	for (const application of applied) {
		await ctx.db.patch(application._id, { status: "declined" });
	}
	return applied.length === MAX_APPLICATIONS;
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
	await finishHackathon(ctx, hackathon);
}

/** Marks the Hackathon done and logs it on the Startup's Activity, once. */
export async function finishHackathon(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<void> {
	if (hackathon.status === "done") {
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

/** Whether the Hackathon passes every filter that is set. `paid` means Builders get something. */
export function matchesExplore(
	hackathon: Doc<"hackathons">,
	filters: {
		role?: Doc<"hackathons">["job"]["role"];
		weeks?: 1 | 2;
		paid?: boolean;
	},
): boolean {
	return (
		(filters.role === undefined || hackathon.job.role === filters.role) &&
		(filters.weeks === undefined || hackathon.weeks === filters.weeks) &&
		(filters.paid !== true || hackathon.buildersGet !== undefined)
	);
}

/** Open Hackathons by soonest start, then building ones by latest start. */
export function sortExplore(
	open: Doc<"hackathons">[],
	building: Doc<"hackathons">[],
): Doc<"hackathons">[] {
	return [
		...[...open].sort((a, b) => a.startsAt - b.startsAt),
		...[...building].sort((a, b) => b.startsAt - a.startsAt),
	];
}

/** One Explore row. Its Startup and hiring record are loaded once per Startup by the caller. */
export function toExploreHackathon(
	hackathon: Doc<"hackathons">,
	startup: Doc<"startups">,
	hiringRecord: HiringRecord,
) {
	return {
		hackathonId: hackathon._id,
		status: hackathon.status,
		job: hackathon.job,
		weeks: hackathon.weeks,
		startsAt: hackathon.startsAt,
		buildersGet: hackathon.buildersGet ?? null,
		startup: {
			name: startup.name,
			slug: startup.slug,
			rating: startup.rating,
			ratingChange: startup.ratingChange,
			isProvisional: startup.provisional,
		},
		hiringRecord,
	};
}
