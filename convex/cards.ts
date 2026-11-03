import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import {
	endPastCards,
	loadBoardCards,
	markVerified,
	normalizeNotes,
	normalizeTitle,
	parseShipped,
	requireAllowed,
	requireCardAccess,
	requireParticipantBoardAccess,
	requireRoomIn,
	requireTeamOwner,
	toCardView,
} from "./cards/model";
import { ENDED, isNotFinished, shipped, submitLandsIn } from "./cards/rules";
import { loadWeekContext } from "./cycles/model";
import { finishAfterReview } from "./hackathons/lifecycle";
import {
	loadHackathonCards,
	loadHackathonCardsInReview,
	requireHackathonFounder,
} from "./hackathons/model";
import { requireUserId } from "./lib/auth";
import { markActive } from "./momentum/credit";
import { requireTeam } from "./startups/team";

export const listBoard = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);

		const now = Date.now();
		const { week } = await loadWeekContext(ctx, startup, now);
		const cards = await loadBoardCards(ctx, args.startupId, now, week);
		return await Promise.all(cards.map((card) => toCardView(ctx, card)));
	},
});

/** One Participant's Cards on a Hackathon, in every status. */
export const listParticipantBoard = query({
	args: { hackathonId: v.id("hackathons"), participantId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireParticipantBoardAccess(
			ctx,
			args.hackathonId,
			args.participantId,
			userId,
		);

		const cards = await loadHackathonCards(
			ctx,
			args.hackathonId,
			args.participantId,
		);
		return await Promise.all(cards.map((card) => toCardView(ctx, card)));
	},
});

/** Participants' Cards waiting in Review, oldest submission first. */
export const listReviewQueue = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireHackathonFounder(ctx, args.hackathonId, userId);

		const queue = (
			await loadHackathonCardsInReview(ctx, args.hackathonId)
		).sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
		return await Promise.all(
			queue.map(async (card) => ({
				...(await toCardView(ctx, card)),
				submittedAt: card.submittedAt ?? 0,
			})),
		);
	},
});

/** One Startup Card, opened from its own workspace (the id comes from a link). Hackathon Cards, other Startups' Cards and ids that aren't Cards read as missing. */
export const get = query({
	args: { startupId: v.id("startups"), cardId: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireTeam(ctx, args.startupId, userId);

		const cardId = ctx.db.normalizeId("cards", args.cardId);
		const card = cardId ? await ctx.db.get(cardId) : null;
		if (!card || card.startupId !== args.startupId || card.hackathonId) {
			return null;
		}
		return await toCardView(ctx, card);
	},
});

export const create = mutation({
	args: {
		startupId: v.id("startups"),
		title: v.string(),
		ownerId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);
		const title = normalizeTitle(args.title);
		const ownerId = args.ownerId ?? userId;
		await requireTeamOwner(ctx, args.startupId, ownerId);
		const { week } = await loadWeekContext(ctx, startup, Date.now());
		await endPastCards(ctx, args.startupId, week);
		await requireRoomIn(ctx, { startupId: args.startupId, ownerId }, "todo");

		return await ctx.db.insert("cards", {
			startupId: args.startupId,
			ownerId,
			title,
			notes: "",
			status: "todo",
			week,
		});
	},
});

export const update = mutation({
	args: {
		cardId: v.id("cards"),
		title: v.optional(v.string()),
		notes: v.optional(v.string()),
		ownerId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { card, actor } = await requireCardAccess(ctx, args.cardId, userId);

		const patch: Partial<typeof card> = {};
		if (args.title !== undefined) {
			requireAllowed(card, { kind: "retitle" }, actor);
			patch.title = normalizeTitle(args.title);
		}
		if (args.ownerId !== undefined) {
			requireAllowed(card, { kind: "reassign" }, actor);
			await requireTeamOwner(ctx, card.startupId, args.ownerId);
			if (card.status === "in_progress" && args.ownerId !== card.ownerId) {
				await requireRoomIn(
					ctx,
					{ ...card, ownerId: args.ownerId },
					"in_progress",
				);
			}
			patch.ownerId = args.ownerId;
		}
		if (args.notes !== undefined) {
			requireAllowed(card, { kind: "editNotes" }, actor);
			const notes = normalizeNotes(args.notes);
			if (notes !== card.notes) {
				patch.notes = notes;
				patch.notesEditedAt = Date.now();
				patch.notesEditedBy = userId;
			}
		}
		await ctx.db.patch(card._id, patch);
	},
});

export const move = mutation({
	args: {
		cardId: v.id("cards"),
		to: v.union(v.literal("todo"), v.literal("in_progress")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { card, startup, actor } = await requireCardAccess(
			ctx,
			args.cardId,
			userId,
		);
		const week = await settleWeek(ctx, startup, card);
		requireAllowed(card, { kind: "move", to: args.to }, actor);
		// A Send back always goes through, so the Founder can empty Review.
		if (card.status !== "review" && card.status !== args.to) {
			await requireRoomIn(ctx, card, args.to);
		}

		// Sent back after its week ended: it ends now, rather than waiting in To do.
		const ended =
			week !== null &&
			isNotFinished({ status: args.to, week: card.week }, week);
		await ctx.db.patch(card._id, { status: ended ? "not_finished" : args.to });
		// Only a Send back can empty the Review queue.
		if (card.status === "review") {
			await finishAfterReview(ctx, card);
		}
	},
});

export const submit = mutation({
	args: { cardId: v.id("cards"), shipped },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { card, startup, actor } = await requireCardAccess(
			ctx,
			args.cardId,
			userId,
		);
		await settleWeek(ctx, startup, card);
		requireAllowed(card, { kind: "submit" }, actor);
		const proof = parseShipped(args.shipped);

		const now = Date.now();
		if (card.ownerId === userId) {
			await markActive(ctx, userId, now);
		}
		if (submitLandsIn(card, actor) === "done") {
			await ctx.db.patch(card._id, { submittedAt: now });
			await markVerified(ctx, card, proof, userId, now);
			return;
		}
		await ctx.db.patch(card._id, {
			status: "review",
			shipped: proof,
			submittedAt: now,
		});
	},
});

export const verify = mutation({
	args: { cardId: v.id("cards") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { card, actor } = await requireCardAccess(ctx, args.cardId, userId);
		requireAllowed(card, { kind: "verify" }, actor);
		if (!card.shipped) {
			throw new ConvexError("This Card isn't in Review");
		}

		await markVerified(ctx, card, card.shipped, userId, Date.now());
		await finishAfterReview(ctx, card);
	},
});

export const remove = mutation({
	args: { cardId: v.id("cards") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { card, actor } = await requireCardAccess(ctx, args.cardId, userId);
		requireAllowed(card, { kind: "delete" }, actor);

		await ctx.db.delete(card._id);
	},
});

/** Ends last week's unfinished Cards before a Startup Card moves, refusing `card` if its own week is over. The current week, or `null` for a Hackathon Card. */
async function settleWeek(
	ctx: MutationCtx,
	startup: Doc<"startups">,
	card: Doc<"cards">,
): Promise<string | null> {
	if (card.hackathonId) {
		return null;
	}
	const { week } = await loadWeekContext(ctx, startup, Date.now());
	if (isNotFinished(card, week)) {
		throw new ConvexError(ENDED);
	}
	await endPastCards(ctx, startup._id, week);
	return week;
}
