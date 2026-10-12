import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireHackathonFounder } from "../hiring/hackathons.rules";
import { requireUserId } from "../lib/auth";
import { MAX_BUILDERS, MAX_HACKATHON_CARDS } from "../shared/limits";
import { shipped } from "../shared/validators";
import { requireTeam } from "../startups/access.rules";
import {
	loadBoardCards,
	markVerified,
	normalizeNotes,
	normalizeTitle,
	parseShipped,
	requireBuilderBoardAccess,
	requireCardAccess,
	requireNotVerified,
	requireTeamOwner,
	toCardView,
} from "./cards.rules";

export const listBoard = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireTeam(ctx, args.startupId, userId);

		const cards = await loadBoardCards(ctx, args.startupId, Date.now());
		return await Promise.all(cards.map((card) => toCardView(ctx, card)));
	},
});

/** One Builder's Cards on a Hackathon, in every status. */
export const listBuilderBoard = query({
	args: { hackathonId: v.id("hackathons"), builderId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireBuilderBoardAccess(
			ctx,
			args.hackathonId,
			args.builderId,
			userId,
		);

		const cards = await ctx.db
			.query("cards")
			.withIndex("by_hackathon_and_owner", (q) =>
				q.eq("hackathonId", args.hackathonId).eq("ownerId", args.builderId),
			)
			.take(MAX_HACKATHON_CARDS);
		return await Promise.all(cards.map((card) => toCardView(ctx, card)));
	},
});

/** Builders' Cards waiting in Review, oldest submission first. */
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
			.take(MAX_BUILDERS * MAX_HACKATHON_CARDS);
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
		const { card } = await requireCardAccess(ctx, args.cardId, userId);
		if (args.title !== undefined || args.ownerId !== undefined) {
			// Only the notes of a verified Card may change.
			requireNotVerified(card);
		}

		const patch: Partial<typeof card> = {};
		if (args.title !== undefined) {
			patch.title = normalizeTitle(args.title);
		}
		if (args.ownerId !== undefined) {
			if (card.hackathonId) {
				throw new ConvexError("Hackathon Cards stay with their Builder");
			}
			// Verifying credits the owner, so the owner is fixed once submitted.
			if (card.status === "review") {
				throw new ConvexError("This Card is in Review");
			}
			await requireTeamOwner(ctx, card.startupId, args.ownerId);
			patch.ownerId = args.ownerId;
		}
		if (args.notes !== undefined) {
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
		const { card, role } = await requireCardAccess(ctx, args.cardId, userId);
		requireNotVerified(card);
		if (card.status === "review" && role !== "founder") {
			throw new ConvexError("Only the Founder can send a Card back");
		}

		await ctx.db.patch(card._id, { status: args.to });
	},
});

export const submit = mutation({
	args: { cardId: v.id("cards"), shipped },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { card, role } = await requireCardAccess(ctx, args.cardId, userId);
		if (card.ownerId !== userId) {
			throw new ConvexError("Only the Card's owner can submit it");
		}
		requireNotVerified(card);
		if (card.status === "review") {
			throw new ConvexError("This Card is in Review");
		}
		const proof = parseShipped(args.shipped);

		const now = Date.now();
		if (role === "founder") {
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
		const { card, role } = await requireCardAccess(ctx, args.cardId, userId);
		if (role !== "founder") {
			throw new ConvexError("Only the Founder can do this");
		}
		if (card.status !== "review" || !card.shipped) {
			throw new ConvexError("This Card isn't in Review");
		}

		await markVerified(ctx, card, card.shipped, userId, Date.now());
	},
});

export const remove = mutation({
	args: { cardId: v.id("cards") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { card, role } = await requireCardAccess(ctx, args.cardId, userId);
		requireNotVerified(card);
		if (role === "builder") {
			throw new ConvexError("Only the Founder can remove this Card");
		}
		if (card.ownerId !== userId && role !== "founder") {
			throw new ConvexError(
				"Only the owner or the Founder can remove this Card",
			);
		}

		await ctx.db.delete(card._id);
	},
});
