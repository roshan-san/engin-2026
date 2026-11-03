import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { cycleHeader } from "./activity/model";
import { endPastCards } from "./cards/model";
import { MAX_BOARD_CARDS } from "./cards/rules";
import { MAX_CONTRIBUTORS } from "./contributors/rules";
import { loadWeekContext, loadWeekRow } from "./cycles/model";
import {
	closingOf,
	firstWeekFor,
	type Meetings,
	meetingSlot,
	openingOf,
	shiftWeek,
	showsScopeHint,
	slotRefusal,
	startRefusal,
	weekOf,
} from "./cycles/rules";
import { requireUserId } from "./lib/auth";
import { assertUrl } from "./lib/text";
import { requireFounder, requireTeam } from "./startups/team";

type Ctx = Parameters<typeof loadWeekContext>[0];

/** The Founder first, then Contributors: id, name and sign-in email. */
async function loadTeam(ctx: Ctx, startup: Doc<"startups">) {
	const rows = await ctx.db
		.query("contributors")
		.withIndex("by_startup_and_user", (q) => q.eq("startupId", startup._id))
		.take(MAX_CONTRIBUTORS);
	const users = await Promise.all(
		[startup.founderId, ...rows.map((row) => row.userId)].map((id) =>
			ctx.db.get(id),
		),
	);
	return users
		.filter((user) => user !== null)
		.map((user) => ({
			userId: user._id,
			name: user.name ?? "Someone",
			email: user.email ?? null,
		}));
}

/** The next opening and closing meetings still to end. */
function nextMeetings(now: number, meetings: Meetings, week: string) {
	let opening = openingOf(week, meetings.opening);
	if (now >= opening.endsAt) {
		opening = openingOf(shiftWeek(week, 1), meetings.opening);
	}
	let closing = closingOf(weekOf(now), meetings.closing);
	if (now >= closing.endsAt) {
		closing = closingOf(shiftWeek(weekOf(now), 1), meetings.closing);
	}
	return { nextOpening: opening, nextClosing: closing };
}

/** The Cycle as of `now`: the page passes its clock, to the minute, so the lock shows on time. Mutations use the server's. */
export const getCurrent = query({
	args: { startupId: v.id("startups"), now: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup, role } = await requireTeam(ctx, args.startupId, userId);

		const now = args.now ?? Date.now();
		const { meetings, isSolo, week, state, row } = await loadWeekContext(
			ctx,
			startup,
			now,
		);
		const isFounder = role === "founder";
		const emails = isFounder
			? (await loadTeam(ctx, startup))
					.map((person) => person.email)
					.filter((email) => email !== null)
			: null;
		const next = meetings ? nextMeetings(now, meetings, week) : null;
		return {
			...cycleHeader(startup, weekOf(now)),
			state,
			isSolo,
			/** The week new Cards join, and the one being planned while locked. */
			planningWeek: week,
			meetings: meetings
				? {
						opening: meetings.opening,
						closing: meetings.closing,
						openingLink: meetings.openingLink ?? null,
						closingLink: meetings.closingLink ?? null,
					}
				: null,
			nextOpening: next?.nextOpening ?? null,
			nextClosing: next?.nextClosing ?? null,
			startedAt: row?.startedAt ?? null,
			showsScopeHint: showsScopeHint(now, meetings, isSolo),
			offUserIds: row?.offUserIds ?? [],
			/** Founder only: every team email, for the calendar invite. */
			guests: emails,
			/** Founder only: team emails not on the meetings yet. */
			uninvited:
				emails && meetings
					? emails.filter((email) => !meetings.invited.includes(email))
					: isFounder
						? []
						: null,
		};
	},
});

export const setMeetings = mutation({
	args: {
		startupId: v.id("startups"),
		opening: meetingSlot,
		closing: meetingSlot,
		openingLink: v.optional(v.string()),
		closingLink: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const startup = await requireFounder(ctx, args.startupId, userId);
		const { isSolo } = await loadWeekContext(ctx, startup, Date.now());
		if (isSolo) {
			throw new ConvexError("Meetings start when someone joins your team");
		}
		const refusal = slotRefusal(args.opening) ?? slotRefusal(args.closing);
		if (refusal) {
			throw new ConvexError(refusal);
		}

		const slots = { opening: args.opening, closing: args.closing };
		await ctx.db.patch(startup._id, {
			meetings: {
				...slots,
				openingLink: assertUrl(args.openingLink, "Meeting link"),
				closingLink: assertUrl(args.closingLink, "Meeting link"),
				firstWeek: firstWeekFor(Date.now(), startup.meetings, slots),
				invited: startup.meetings?.invited ?? [],
			},
		});
		return null;
	},
});

/** The Founder created the meetings in Google Calendar for everyone on the team now. */
export const markInvited = mutation({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const startup = await requireFounder(ctx, args.startupId, userId);
		if (!startup.meetings) {
			throw new ConvexError("Set your two weekly meetings first");
		}

		const invited = (await loadTeam(ctx, startup))
			.map((person) => person.email)
			.filter((email) => email !== null);
		await ctx.db.patch(startup._id, {
			meetings: { ...startup.meetings, invited },
		});
		return null;
	},
});

/** The Founder's week to plan, refused once it has started. */
async function requirePlanning(
	ctx: MutationCtx,
	startupId: Id<"startups">,
	userId: Id<"users">,
) {
	const startup = await requireFounder(ctx, startupId, userId);
	const now = Date.now();
	const context = await loadWeekContext(ctx, startup, now);
	if (context.state !== "planning" || !context.meetings) {
		throw new ConvexError("This week has already started");
	}
	return { startup, now, ...context, meetings: context.meetings };
}

async function saveWeekRow(
	ctx: MutationCtx,
	startupId: Id<"startups">,
	week: string,
	patch: { startedAt?: number; offUserIds?: Id<"users">[] },
) {
	const row = await loadWeekRow(ctx, startupId, week);
	if (row) {
		await ctx.db.patch(row._id, patch);
		return;
	}
	await ctx.db.insert("cycleWeeks", {
		startupId,
		week,
		offUserIds: patch.offUserIds ?? [],
		startedAt: patch.startedAt,
	});
}

/** Marks someone off for the week being planned, or back on. */
export const setOff = mutation({
	args: {
		startupId: v.id("startups"),
		userId: v.id("users"),
		off: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup, week, row } = await requirePlanning(
			ctx,
			args.startupId,
			userId,
		);
		const team = await loadTeam(ctx, startup);
		if (!team.some((person) => person.userId === args.userId)) {
			throw new ConvexError("They're not on this Startup's team");
		}

		const others = (row?.offUserIds ?? []).filter((id) => id !== args.userId);
		await saveWeekRow(ctx, startup._id, week, {
			offUserIds: args.off ? [...others, args.userId] : others,
		});
		return null;
	},
});

/** Opens the Board after the opening meeting. */
export const startWeek = mutation({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup, now, week, row, state, meetings } = await requirePlanning(
			ctx,
			args.startupId,
			userId,
		);

		const [team, weekCards, inReview] = await Promise.all([
			loadTeam(ctx, startup),
			ctx.db
				.query("cards")
				.withIndex("by_startup_and_week", (q) =>
					q.eq("startupId", startup._id).eq("week", week),
				)
				.take(MAX_BOARD_CARDS),
			ctx.db
				.query("cards")
				.withIndex("by_startup_and_hackathon_and_status_and_verifiedAt", (q) =>
					q
						.eq("startupId", startup._id)
						.eq("hackathonId", undefined)
						.eq("status", "review"),
				)
				.take(MAX_BOARD_CARDS),
		]);
		const off = row?.offUserIds ?? [];
		const counted = weekCards.filter(
			(card) => !card.hackathonId && card.status !== "not_finished",
		);
		const refusal = startRefusal({
			now,
			meetings,
			state,
			reviewCount: inReview.length,
			people: team.map((person) => ({
				name: person.name,
				cardCount: counted.filter((card) => card.ownerId === person.userId)
					.length,
				isOff: off.includes(person.userId),
			})),
		});
		if (refusal) {
			throw new ConvexError(refusal);
		}

		await endPastCards(ctx, startup._id, week);
		await saveWeekRow(ctx, startup._id, week, { startedAt: now });
		return null;
	},
});
