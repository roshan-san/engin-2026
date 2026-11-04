import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { loadPlan, planViewFor } from "../billing/model";
import { MAX_OPEN_HACKATHONS, PLANS, type PlanView } from "../billing/rules";
import { CARD_TEXT } from "../cards/rules";
import { discipline } from "../lib/disciplines";
import { limitText, requireLimitedText } from "../lib/text";
import { loadFoundedStartups } from "../startups/model";
import { requireFounder } from "../startups/team";
import type { HiringRecord } from "./record";
import {
	canStartAt,
	HACKATHON_TEXT,
	hackathonDates,
	isPaid,
	jobMode,
	jobPay,
	MAX_HACKATHON_CARDS,
	MAX_PARTICIPANTS,
	MIN_HACKATHON_CARDS,
	NOTHING,
	RUNNING,
	START_MESSAGE,
} from "./rules";

/** What a Founder fills in to draft a Hackathon. */
export const draftArgs = {
	job: v.object({
		title: v.string(),
		discipline,
		pay: jobPay,
		mode: jobMode,
	}),
	problem: v.string(),
	weeks: v.number(),
	startsAt: v.number(),
	participantsGet: v.string(),
	cards: v.array(
		v.object({ title: v.string(), notes: v.optional(v.string()) }),
	),
};

type DraftInput = {
	job: Doc<"hackathons">["job"];
	problem: string;
	weeks: number;
	startsAt: number;
	participantsGet: string;
	cards: { title: string; notes?: string }[];
};

/** Checks a draft and returns its normalized fields with the derived dates. */
export function requireValidDraft(input: DraftInput, now: number) {
	if (!canStartAt(input.startsAt, now)) {
		throw new ConvexError(START_MESSAGE);
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
		job: {
			...input.job,
			title: requireLimitedText(input.job.title, "Title", HACKATHON_TEXT.title),
		},
		problem: requireLimitedText(
			input.problem,
			"Problem",
			HACKATHON_TEXT.problem,
		),
		weeks,
		startsAt: input.startsAt,
		...hackathonDates(input.startsAt, weeks),
		participantsGet: requireParticipantsGet(input.participantsGet),
		cards: input.cards.map((card) => ({
			title: requireLimitedText(card.title, "Card title", CARD_TEXT.title),
			notes: limitText(card.notes, "Notes", CARD_TEXT.notes) ?? "",
		})),
	};
}

/** What Builders get, trimmed: a required choice, "Nothing" included. */
function requireParticipantsGet(value: string): string {
	if (!value.trim()) {
		throw new ConvexError("Pick what Builders get");
	}
	return requireLimitedText(
		value,
		"What Builders get",
		HACKATHON_TEXT.participantsGet,
	);
}

/** What Builders get, as shown: a Hackathon saved before the choice was required reads as "Nothing". */
export function participantsGetOf(hackathon: Doc<"hackathons">): string {
	return hackathon.participantsGet ?? NOTHING;
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

type Ctx = QueryCtx | MutationCtx;

/** The Hackathon's Participants' applications. */
export async function loadParticipants(
	ctx: Ctx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"applications">[]> {
	return await ctx.db
		.query("applications")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathonId).eq("status", "participating"),
		)
		.take(MAX_PARTICIPANTS);
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

/** Participants' Cards waiting in Review on the Hackathon. */
export async function loadHackathonCardsInReview(
	ctx: QueryCtx | MutationCtx,
	hackathonId: Id<"hackathons">,
): Promise<Doc<"cards">[]> {
	const inReview = await ctx.db
		.query("cards")
		.withIndex("by_hackathon_and_status", (q) =>
			q.eq("hackathonId", hackathonId).eq("status", "review"),
		)
		.take(MAX_PARTICIPANTS * MAX_HACKATHON_CARDS);
	return inReview.filter((card) => card.ownerId !== undefined);
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
		discipline?: Doc<"hackathons">["job"]["discipline"];
		weeks?: 1 | 2;
		paid?: boolean;
	},
): boolean {
	return (
		(filters.discipline === undefined ||
			hackathon.job.discipline === filters.discipline) &&
		(filters.weeks === undefined || hackathon.weeks === filters.weeks) &&
		(filters.paid !== true || isPaid(hackathon.participantsGet))
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
		participantsGet: participantsGetOf(hackathon),
		startup: {
			name: startup.name,
			slug: startup.slug,
			momentum: startup.momentum,
			momentumChange: startup.momentumChange,
			isProvisional: startup.provisional,
			logoUrl,
		},
		hiringRecord,
	};
}

/** Hackathons published since `since` across the Startups, counting up to `limit`. */
async function countPublishedSince(
	ctx: QueryCtx,
	startupIds: Id<"startups">[],
	since: number,
	limit: number,
): Promise<number> {
	let count = 0;
	for (const startupId of startupIds) {
		const published = await ctx.db
			.query("hackathons")
			.withIndex("by_startup_and_publishedAt", (q) =>
				q.eq("startupId", startupId).gte("publishedAt", since),
			)
			.take(limit - count);
		count += published.length;
		if (count >= limit) break;
	}
	return count;
}

/** Hackathons open, live or deciding across the Startups, counting up to the cap. */
async function countRunning(
	ctx: QueryCtx,
	startupIds: Id<"startups">[],
): Promise<number> {
	const running = await Promise.all(
		startupIds.map((startupId) =>
			loadRunningHackathons(ctx, startupId, MAX_OPEN_HACKATHONS),
		),
	);
	return Math.min(running.flat().length, MAX_OPEN_HACKATHONS);
}

/** The Founder's plan with what's left of it, or null without Pro. */
export async function loadPlanView(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<PlanView | null> {
	const plan = await loadPlan(ctx, userId);
	if (!plan) {
		return null;
	}
	const startupIds = (await loadFoundedStartups(ctx, userId)).map(
		(startup) => startup._id,
	);
	const published = await countPublishedSince(
		ctx,
		startupIds,
		plan.periodStart,
		PLANS[plan.plan].hackathonsPerPeriod,
	);
	return planViewFor(plan, {
		published,
		running: await countRunning(ctx, startupIds),
	});
}
