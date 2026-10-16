import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../model/auth";
import {
	loadBoardCards,
	markVerified,
	normalizeNotes,
	normalizeTitle,
	parseShipped,
	requireAllowed,
	requireCardAccess,
	requireParticipantBoardAccess,
	requireTeamOwner,
	toCardView,
} from "../model/cards";
import { requireHackathonFounder } from "../model/hackathons";
import { requireTeam } from "../model/teamAccess";
import { submitLandsIn } from "../shared/cardRules";
import { MAX_HACKATHON_CARDS, MAX_PARTICIPANTS } from "../shared/limits";
import { shipped } from "../shared/validators";

export const listBoard = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireTeam(ctx, args.startupId, userId);

		const cards = await loadBoardCards(ctx, args.startupId, Date.now());
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

		const cards = await ctx.db
			.query("cards")
			.withIndex("by_hackathon_and_owner", (q) =>
				q.eq("hackathonId", args.hackathonId).eq("ownerId", args.participantId),
			)
			.take(MAX_HACKATHON_CARDS);
		return await Promise.all(cards.map((card) => toCardView(ctx, card)));
	},
});

/** Participants' Cards waiting in Review, oldest submission first. */
export const listReviewQueue = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireHackathonFounder(ctx, args.hackathonId, userId);

		const inReview = await ctx.db
			.query("cards")
			.withIndex("by_hackathon_and_status", (q) =>
				q.eq("hackathonId", args.hackathonId).eq("status", "review"),
			)
			.take(MAX_PARTICIPANTS * MAX_HACKATHON_CARDS);
		const queue = inReview
			.filter((card) => card.ownerId !== undefined)
			.sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
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
		await requireTeam(ctx, args.startupId, userId);
		const title = normalizeTitle(args.title);
		const ownerId = args.ownerId ?? userId;
		await requireTeamOwner(ctx, args.startupId, ownerId);

		return await ctx.db.insert("cards", {
			startupId: args.startupId,
			ownerId,
			title,
			notes: "",
			status: "todo",
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
		const { card, actor } = await requireCardAccess(ctx, args.cardId, userId);
		requireAllowed(card, { kind: "move", to: args.to }, actor);

		await ctx.db.patch(card._id, { status: args.to });
	},
});

export const submit = mutation({
	args: { cardId: v.id("cards"), shipped },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { card, actor } = await requireCardAccess(ctx, args.cardId, userId);
		requireAllowed(card, { kind: "submit" }, actor);
		const proof = parseShipped(args.shipped);

		const now = Date.now();
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
