import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_LISTED_HACKATHONS } from "../lib/limits";
import { loadPublicUser } from "../people/users.rules";
import { hackathonVerdict } from "../schema";
import { logActivity } from "../teams/activity.rules";
import {
	getMembership,
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import { requireIpTerms } from "./ipTerms.rules";
import { loadHackathonOffers } from "./offers.rules";
import { publishDraft, requirePublishable } from "./publish.rules";
import {
	announceStarterTaskChange,
	insertStarterTask,
	listCurrentParticipantIds,
	loadStarterTasks,
	replaceStarterTasks,
	requireStarterTask,
	requireStarterTaskRoom,
	requireStarterTasksEditable,
	seedStarterTask,
} from "./starterTasks.rules";
import {
	buildDraftFields,
	cancelHackathon,
	draftFields,
	getHackathonApplication,
	insertDraftHackathon,
	isHackathonLive,
	listHackathonApplications,
	loadPublicHackathon,
	requireHackathon,
	requireOpenRoleOf,
	requireValidSchedule,
	startHackathon,
	syncHackathonCycle,
} from "./hackathons.rules";
import { closeWithVerdicts } from "./verdicts.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		const hackathons = await ctx.db
			.query("hackathons")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(MAX_LISTED_HACKATHONS);

		return await Promise.all(
			hackathons.map(async (hackathon) => {
				const role = await ctx.db.get(hackathon.roleId);
				return { ...hackathon, roleTitle: role?.title ?? "Role" };
			}),
		);
	},
});

export const listOpenByStartup = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const startup = await ctx.db.get(args.startupId);
		if (!startup?.isPublic) {
			return [];
		}
		return await ctx.db
			.query("hackathons")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", args.startupId).eq("status", "open"),
			)
			.take(MAX_LISTED_HACKATHONS);
	},
});

/**
 * The public hackathon page: readable signed out, and never private fields.
 * Takes the raw URL id, so a made-up address is "not found", not an error.
 */
export const getPublic = query({
	args: { hackathonId: v.string() },
	handler: async (ctx, args) => {
		const hackathonId = ctx.db.normalizeId("hackathons", args.hackathonId);
		const loaded = hackathonId
			? await loadPublicHackathon(ctx, hackathonId)
			: null;
		if (!loaded) {
			return null;
		}
		const { hackathon, startup } = loaded;

		const userId = await getAuthUserId(ctx);
		const membership = userId
			? await getMembership(ctx, startup._id, userId)
			: null;
		const myApplication = userId
			? await getHackathonApplication(ctx, hackathon._id, userId)
			: null;
		const role = await ctx.db.get(hackathon.roleId);
		const starterTasks = await loadStarterTasks(ctx, hackathon);

		return {
			_id: hackathon._id,
			title: hackathon.title,
			description: hackathon.description,
			status: hackathon.status,
			startsAt: hackathon.startsAt,
			endsAt: hackathon.endsAt,
			deadline: hackathon.applicationDeadline ?? hackathon.startsAt,
			participantCount: hackathon.participantCount,
			maxParticipants: hackathon.maxParticipants,
			prize: hackathon.prize ?? null,
			expectedOutcome: hackathon.expectedOutcome ?? null,
			evaluationCriteria: hackathon.evaluationCriteria ?? null,
			compensation: hackathon.compensation ?? null,
			startup: { name: startup.name, slug: startup.slug },
			role: { title: role?.title ?? "Role", type: role?.type ?? null },
			starterTasks: starterTasks.map((starterTask) => ({
				_id: starterTask._id,
				title: starterTask.title,
				description: starterTask.description ?? null,
			})),
			isMember: membership !== null,
			myApplicationStatus: myApplication?.status ?? null,
		};
	},
});

export const get = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			return null;
		}

		const membership = await getMembership(ctx, hackathon.startupId, userId);
		const isMember = membership !== null;
		if (hackathon.status === "draft" && !isMember) {
			return null;
		}
		const application = await getHackathonApplication(
			ctx,
			hackathon._id,
			userId,
		);
		const isParticipant = application?.status === "accepted";
		const role = await ctx.db.get(hackathon.roleId);
		const startup = await ctx.db.get(hackathon.startupId);
		const cycle = await ctx.db.get(hackathon.cycleId);

		const offers = await loadHackathonOffers(ctx, hackathon._id);
		const applicants = [];
		if (isMember) {
			for (const item of await listHackathonApplications(ctx, hackathon._id)) {
				applicants.push({
					...item,
					user: await loadPublicUser(ctx, item.userId),
					offer: offers.get(item._id) ?? null,
				});
			}
		}

		return {
			...hackathon,
			roleTitle: role?.title ?? "Role",
			roleIsOpen: role?.status === "open",
			startupName: startup?.name ?? "Startup",
			startupSlug: startup?.slug ?? "",
			/** The expected outcome, as the Cycle's goal once published. */
			goal: cycle?.goal ?? null,
			isMember,
			isFounder: membership?.role === "founder",
			isParticipant,
			myStatus: application?.status ?? null,
			myApplicationId: application?._id ?? null,
			myVerdict: application?.verdict ?? null,
			myEvaluation: application?.evaluation ?? null,
			myEvaluationPublic: application?.evaluationPublic ?? false,
			myOffer: application ? (offers.get(application._id) ?? null) : null,
			applicants,
		};
	},
});

/** A hackathon's Starter Tasks in the Founder's order, for Startup members. */
export const listStarterTasks = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await requireHackathon(ctx, args.hackathonId);
		await requireMembership(ctx, hackathon.startupId, userId);
		return await loadStarterTasks(ctx, hackathon);
	},
});

/** Creates a draft with its Starter Tasks. Nothing is public or scheduled until `publish`. */
export const create = mutation({
	args: { startupId: v.id("startups"), ...draftFields },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		const role = await requireOpenRoleOf(ctx, args.startupId, args.roleId);
		requireValidSchedule(args, Date.now());
		const fields = buildDraftFields(args, role);

		const hackathonId = await insertDraftHackathon(ctx, args.startupId, fields);
		const hackathon = await requireHackathon(ctx, hackathonId);
		await replaceStarterTasks(ctx, hackathon, args.starterTasks, userId);

		return hackathonId;
	},
});

/** Replaces a whole draft, Starter Tasks included. Published hackathons don't change here. */
export const update = mutation({
	args: { hackathonId: v.id("hackathons"), ...draftFields },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			throw new Error("Hackathon not found");
		}

		await requireFounderMembership(ctx, hackathon.startupId, userId);
		if (hackathon.status !== "draft") {
			throw new Error("Only an unpublished hackathon can be edited");
		}
		const role = await requireOpenRoleOf(ctx, hackathon.startupId, args.roleId);
		requireValidSchedule(args, Date.now());

		const fields = buildDraftFields(args, role);
		await ctx.db.patch(hackathon._id, fields);
		await syncHackathonCycle(ctx, hackathon, fields);
		await replaceStarterTasks(ctx, hackathon, args.starterTasks, userId);
	},
});

export const addStarterTask = mutation({
	args: {
		hackathonId: v.id("hackathons"),
		title: v.string(),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await requireHackathon(ctx, args.hackathonId);
		await requireFounderMembership(ctx, hackathon.startupId, userId);
		requireStarterTasksEditable(hackathon);
		requireStarterTaskRoom((await loadStarterTasks(ctx, hackathon)).length + 1);

		const starterTaskId = await insertStarterTask(ctx, hackathon, args, userId);

		const participantIds = await listCurrentParticipantIds(ctx, hackathon);
		if (participantIds.length > 0) {
			const starterTask = await ctx.db.get(starterTaskId);
			if (starterTask) {
				await seedStarterTask(ctx, starterTask, participantIds);
				await announceStarterTaskChange(
					ctx,
					hackathon,
					participantIds,
					`New Starter Task in ${hackathon.title}: ${starterTask.title}`,
					"hackathon_starter_task_added",
				);
			}
		}

		return starterTaskId;
	},
});

/** Participants keep their copies: the work on a lane belongs to them. */
export const removeStarterTask = mutation({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { starterTask, hackathonId } = await requireStarterTask(
			ctx,
			args.taskId,
		);
		const hackathon = await requireHackathon(ctx, hackathonId);
		await requireFounderMembership(ctx, hackathon.startupId, userId);
		requireStarterTasksEditable(hackathon);

		await ctx.db.delete(starterTask._id);

		const participantIds = await listCurrentParticipantIds(ctx, hackathon);
		if (participantIds.length > 0) {
			await announceStarterTaskChange(
				ctx,
				hackathon,
				participantIds,
				`Starter Task removed from ${hackathon.title}: ${starterTask.title}`,
				"hackathon_starter_task_removed",
			);
		}
	},
});

/**
 * The charge point (design: Pricing rules). One mutation, so a double click
 * or a second tab can't spend twice (eng review C4).
 */
export const publish = mutation({
	args: { hackathonId: v.id("hackathons"), acceptTerms: v.boolean() },
	handler: async (ctx, args): Promise<void> => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			throw new Error("Hackathon not found");
		}

		const now = Date.now();
		await requirePublishable(ctx, hackathon, userId, now);
		requireIpTerms(args.acceptTerms);
		await ctx.db.patch(hackathon._id, { ipAcknowledgedAt: now });
		await publishDraft(ctx, hackathon, userId, now);
	},
});

/** "Pick new dates": only a draft moves, because a published one has its start scheduled. */
export const reschedule = mutation({
	args: {
		hackathonId: v.id("hackathons"),
		startsAt: v.number(),
		endsAt: v.number(),
		applicationDeadline: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			throw new Error("Hackathon not found");
		}

		await requireFounderMembership(ctx, hackathon.startupId, userId);
		if (hackathon.status !== "draft") {
			throw new Error("Only a draft's dates can change");
		}
		requireValidSchedule(args, Date.now());

		await ctx.db.patch(hackathon._id, {
			startsAt: args.startsAt,
			endsAt: args.endsAt,
			applicationDeadline: args.applicationDeadline,
		});
		await syncHackathonCycle(ctx, hackathon, args);
	},
});

export const start = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (hackathon?.status !== "open") {
			return;
		}

		await startHackathon(ctx, hackathon);
		await logActivity(ctx, {
			startupId: hackathon.startupId,
			kind: "hackathon_started",
			hackathonId: hackathon._id,
			summary: `Hackathon "${hackathon.title}" started`,
		});
	},
});

export const cancel = mutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			throw new Error("Hackathon not found");
		}

		await requireFounderMembership(ctx, hackathon.startupId, userId);
		if (hackathon.status !== "draft" && !isHackathonLive(hackathon)) {
			throw new Error(
				"Only a draft, open or active Hackathon can be cancelled",
			);
		}

		await cancelHackathon(ctx, hackathon);
	},
});

export const close = mutation({
	args: {
		hackathonId: v.id("hackathons"),
		verdicts: v.array(
			v.object({
				applicationId: v.id("applications"),
				verdict: hackathonVerdict,
				evaluation: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			throw new Error("Hackathon not found");
		}

		await requireFounderMembership(ctx, hackathon.startupId, userId);
		await closeWithVerdicts(ctx, hackathon, args);
		await logActivity(ctx, {
			startupId: hackathon.startupId,
			kind: "hackathon_closed",
			hackathonId: hackathon._id,
			summary: `Hackathon "${hackathon.title}" closed`,
		});
	},
});
