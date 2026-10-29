import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { limitText, requireLimitedText } from "../lib/text";
import { weekOf, weekStart } from "../shared/cycles";
import { hackathonDates, RUNNING } from "../shared/hackathonPhase";
import {
	MAX_HACKATHON_CARDS,
	MIN_HACKATHON_CARDS,
	TEXT,
} from "../shared/limits";
import { jobMode, jobPay, jobRole } from "../shared/validators";
import type { HiringRecord } from "./hiringRecord";
import { requireFounder } from "./teamAccess";

/** What a Founder fills in to draft a Hackathon. */
export const draftArgs = {
	job: v.object({ role: jobRole, pay: jobPay, mode: jobMode }),
	problem: v.string(),
	weeks: v.number(),
	startsAt: v.number(),
	participantsGet: v.optional(v.string()),
	cards: v.array(
		v.object({ title: v.string(), notes: v.optional(v.string()) }),
	),
};

type DraftInput = {
	job: Doc<"hackathons">["job"];
	problem: string;
	weeks: number;
	startsAt: number;
	participantsGet?: string;
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

	return {
		job: input.job,
		problem: requireLimitedText(input.problem, "Problem", TEXT.problem),
		weeks,
		startsAt: input.startsAt,
		...hackathonDates(input.startsAt, weeks),
		participantsGet: limitText(
			input.participantsGet,
			"Participants get",
			TEXT.participantsGet,
		),
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

/** A Startup's open, live and deciding Hackathons, up to `limit` of each. */
export async function loadRunningHackathons(
	ctx: QueryCtx | MutationCtx,
	startupId: Id<"startups">,
	limit: number,
): Promise<Doc<"hackathons">[]> {
	const byStatus = await Promise.all(
		RUNNING.map((status) =>
			ctx.db
				.query("hackathons")
				.withIndex("by_startup_and_status", (q) =>
					q.eq("startupId", startupId).eq("status", status),
				)
				.take(limit),
		),
	);
	return byStatus.flat();
}

/** A Participant's Cards on the Hackathon. Without an owner, the template Cards every Participant starts with. */
export async function loadHackathonCards(
	ctx: QueryCtx | MutationCtx,
	hackathonId: Id<"hackathons">,
	ownerId?: Id<"users">,
): Promise<Doc<"cards">[]> {
	return await ctx.db
		.query("cards")
		.withIndex("by_hackathon_and_owner", (q) =>
			q.eq("hackathonId", hackathonId).eq("ownerId", ownerId),
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
	for (const old of await loadHackathonCards(ctx, hackathon._id)) {
		await ctx.db.delete(old._id);
	}
	await insertTemplateCards(ctx, hackathon, cards);
}

/** Gives a Participant their own copy of the template Cards, once. */
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
	for (const card of await loadHackathonCards(ctx, hackathon._id)) {
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

/** Whether the Hackathon passes every filter that is set. `paid` means Participants get something. */
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
		(filters.paid !== true || hackathon.participantsGet !== undefined)
	);
}

/** Open Hackathons by soonest start, then live ones by latest start. */
export function sortExplore(
	open: Doc<"hackathons">[],
	live: Doc<"hackathons">[],
): Doc<"hackathons">[] {
	return [
		...[...open].sort((a, b) => a.startsAt - b.startsAt),
		...[...live].sort((a, b) => b.startsAt - a.startsAt),
	];
}

/** One Explore row. Its Startup, hiring record and logo URL are loaded once per Startup by the caller. */
export function toExploreHackathon(
	hackathon: Doc<"hackathons">,
	startup: Doc<"startups">,
	hiringRecord: HiringRecord,
	logoUrl: string | null,
) {
	return {
		hackathonId: hackathon._id,
		status: hackathon.status,
		job: hackathon.job,
		weeks: hackathon.weeks,
		startsAt: hackathon.startsAt,
		participantsGet: hackathon.participantsGet ?? null,
		startup: {
			name: startup.name,
			slug: startup.slug,
			rating: startup.rating,
			ratingChange: startup.ratingChange,
			isProvisional: startup.provisional,
			logoUrl,
		},
		hiringRecord,
	};
}
