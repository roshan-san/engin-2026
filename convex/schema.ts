import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convention: `_creationTime` is used for "when was this made" everywhere.
 * Explicit timestamps only exist when they drive an indexed range query.
 */

export const planTier = v.union(v.literal("free"), v.literal("pro"));
export const memberRole = v.union(v.literal("founder"), v.literal("member"));
export const startupStage = v.union(
	v.literal("idea"),
	v.literal("pre-seed"),
	v.literal("seed"),
	v.literal("series-a"),
	v.literal("growth"),
);
export const inviteStatus = v.union(
	v.literal("pending"),
	v.literal("accepted"),
	v.literal("declined"),
	v.literal("expired"),
);
export const notificationKind = v.union(
	v.literal("invite"),
	v.literal("pulse"),
	v.literal("cycle"),
	v.literal("trial_cycle"),
	v.literal("application"),
	v.literal("message"),
	v.literal("billing"),
	v.literal("offer"),
);
export const pulseStatus = v.union(
	v.literal("todo"),
	v.literal("in_progress"),
	/** A Submitted Pulse, awaiting a Founder's review. */
	v.literal("review"),
	v.literal("done"),
);
/**
 * Pre-kanban states, accepted in storage only until `migrations.migratePulses`
 * has run on every deployment. Remove together with `evidenceUrl`.
 */
const legacyPulseStatus = v.union(
	v.literal("backlog"),
	v.literal("active"),
	v.literal("blocked"),
);
export const proofLinkKind = v.union(
	v.literal("pr"),
	v.literal("commit"),
	v.literal("deploy"),
	v.literal("design"),
	v.literal("doc"),
	v.literal("demo"),
	v.literal("other"),
);
export const proofLink = v.object({ kind: proofLinkKind, url: v.string() });
export const pulsePriority = v.union(
	v.literal("low"),
	v.literal("medium"),
	v.literal("high"),
);
export const cycleStatus = v.union(
	v.literal("planned"),
	v.literal("active"),
	v.literal("closed"),
);
export const openingStatus = v.union(v.literal("open"), v.literal("closed"));
export const trialAdmission = v.union(
	v.literal("open"),
	v.literal("application"),
);
/** Where a hackathon credit came from; decides spend order (eng review). */
export const creditSource = v.union(
	v.literal("launch"),
	v.literal("upi"),
	v.literal("rerun"),
	v.literal("pro_monthly"),
	v.literal("purchase"),
);

export const trialStatus = v.union(
	/** Created but not paid for: hidden, not joinable, no start scheduled. */
	v.literal("draft"),
	v.literal("open"),
	v.literal("active"),
	v.literal("closed"),
	v.literal("cancelled"),
);
export const trialVerdict = v.union(
	v.literal("passed_with_offer"),
	v.literal("passed"),
	v.literal("not_passed"),
);
export const offerStatus = v.union(
	v.literal("pending"),
	v.literal("accepted"),
	v.literal("declined"),
	v.literal("withdrawn"),
);
export const activityKind = v.union(
	v.literal("member_joined"),
	v.literal("cycle_started"),
	v.literal("cycle_closed"),
	v.literal("pulse_verified"),
	v.literal("role_posted"),
	v.literal("trial_cycle_started"),
	v.literal("trial_cycle_closed"),
	v.literal("offer_accepted"),
);
export const applicationStatus = v.union(
	v.literal("applied"),
	v.literal("joined"),
	v.literal("rejected"),
	v.literal("withdrawn"),
	v.literal("left"),
	v.literal("completed"),
);

export default defineSchema({
	...authTables,

	users: defineTable({
		name: v.optional(v.string()),
		image: v.optional(v.string()),
		email: v.optional(v.string()),
		emailVerificationTime: v.optional(v.number()),
		planTier: v.optional(planTier),
		username: v.optional(v.string()),
		bio: v.optional(v.string()),
		skills: v.optional(v.array(v.string())),
		headline: v.optional(v.string()),
		location: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
		linkedinUrl: v.optional(v.string()),
		portfolioUrl: v.optional(v.string()),
		/** Denormalised headline reputation. Recomputed from verified work. */
		score: v.optional(v.number()),
		focusedStartupId: v.optional(v.id("startups")),
		hideFromExplore: v.optional(v.boolean()),
	})
		.index("email", ["email"])
		.index("by_username", ["username"]),

	startups: defineTable({
		founderUserId: v.id("users"),
		name: v.string(),
		slug: v.string(),
		tagline: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		stage: v.optional(startupStage),
		website: v.optional(v.string()),
		twitterUrl: v.optional(v.string()),
		linkedinUrl: v.optional(v.string()),
		githubUrl: v.optional(v.string()),
		problem: v.optional(v.string()),
		solution: v.optional(v.string()),
		product: v.optional(v.string()),
		traction: v.optional(v.string()),
		teamBlurb: v.optional(v.string()),
		techStack: v.optional(v.array(v.string())),
		location: v.optional(v.string()),
		remote: v.optional(v.boolean()),
		isPublic: v.boolean(),
		followerCount: v.number(),
		searchText: v.string(),
	})
		.index("by_slug", ["slug"])
		.index("by_founder", ["founderUserId"])
		.index("by_public", ["isPublic"])
		.searchIndex("search_startups", {
			searchField: "searchText",
			filterFields: ["isPublic"],
		}),

	memberships: defineTable({
		startupId: v.id("startups"),
		userId: v.id("users"),
		role: memberRole,
	})
		.index("by_startup_and_user", ["startupId", "userId"])
		.index("by_user", ["userId"])
		.index("by_startup", ["startupId"])
		.index("by_startup_and_role", ["startupId", "role"]),

	follows: defineTable({
		userId: v.id("users"),
		startupId: v.id("startups"),
	})
		.index("by_user_and_startup", ["userId", "startupId"])
		.index("by_user", ["userId"])
		.index("by_startup", ["startupId"]),

	invites: defineTable({
		startupId: v.id("startups"),
		email: v.string(),
		role: memberRole,
		token: v.string(),
		invitedByUserId: v.id("users"),
		status: inviteStatus,
		expiresAt: v.number(),
	})
		.index("by_token", ["token"])
		.index("by_email", ["email"])
		.index("by_startup_and_email", ["startupId", "email"])
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"]),

	notifications: defineTable({
		userId: v.id("users"),
		kind: notificationKind,
		title: v.string(),
		body: v.optional(v.string()),
		href: v.optional(v.string()),
		readAt: v.optional(v.number()),
	}).index("by_user", ["userId"]),

	pulses: defineTable({
		startupId: v.id("startups"),
		cycleId: v.optional(v.id("cycles")),
		trialCycleId: v.optional(v.id("trialCycles")),
		title: v.string(),
		description: v.optional(v.string()),
		status: v.union(pulseStatus, legacyPulseStatus),
		priority: v.optional(pulsePriority),
		assigneeUserId: v.optional(v.id("users")),
		createdByUserId: v.id("users"),
		dueAt: v.optional(v.number()),
		proofLinks: v.optional(v.array(proofLink)),
		/** Legacy single evidence link; see `legacyPulseStatus`. */
		evidenceUrl: v.optional(v.string()),
		/** Owner of the Board a trial Pulse is on. */
		participantUserId: v.optional(v.id("users")),
		/** Why a Founder sent a Submitted Pulse back. */
		reviewNote: v.optional(v.string()),
	})
		.index("by_startup", ["startupId"])
		.index("by_cycle", ["cycleId"])
		.index("by_trial", ["trialCycleId"])
		.index("by_trial_and_status", ["trialCycleId", "status"])
		.index("by_trial_and_participant", ["trialCycleId", "participantUserId"])
		.index("by_assignee", ["assigneeUserId"]),

	activity: defineTable({
		startupId: v.id("startups"),
		kind: activityKind,
		actorUserId: v.optional(v.id("users")),
		cycleId: v.optional(v.id("cycles")),
		pulseId: v.optional(v.id("pulses")),
		roleId: v.optional(v.id("roles")),
		trialCycleId: v.optional(v.id("trialCycles")),
		summary: v.string(),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_cycle", ["startupId", "cycleId"]),

	cycles: defineTable({
		startupId: v.id("startups"),
		title: v.string(),
		startAt: v.number(),
		endAt: v.number(),
		status: cycleStatus,
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"]),

	/** Members (not Founders, who belong to every Cycle implicitly) added to a Cycle. */
	cycleMembers: defineTable({
		cycleId: v.id("cycles"),
		userId: v.id("users"),
	})
		.index("by_cycle_and_user", ["cycleId", "userId"])
		.index("by_cycle", ["cycleId"]),

	roles: defineTable({
		startupId: v.id("startups"),
		title: v.string(),
		type: v.string(),
		skills: v.array(v.string()),
		description: v.string(),
		compensation: v.optional(v.string()),
		equity: v.optional(v.string()),
		location: v.optional(v.string()),
		remote: v.optional(v.boolean()),
		commitment: v.optional(v.string()),
		/** Accepted Offers after which the Role is filled and closes. */
		headcount: v.number(),
		status: openingStatus,
		searchText: v.string(),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_status", ["status"])
		.searchIndex("search_roles", {
			searchField: "searchText",
			filterFields: ["status"],
		}),

	trialCycles: defineTable({
		startupId: v.id("startups"),
		roleId: v.id("roles"),
		title: v.string(),
		description: v.string(),
		admission: trialAdmission,
		maxContributors: v.number(),
		applicationDeadline: v.optional(v.number()),
		startsAt: v.number(),
		endsAt: v.number(),
		expectedOutcome: v.optional(v.string()),
		evaluationCriteria: v.optional(v.string()),
		compensation: v.optional(v.string()),
		/** Optional prize text, paid off-platform, e.g. "₹5,000 to the winner". */
		prize: v.optional(v.string()),
		/** Set at the charge point, when a Founder publishes the draft. */
		publishedAt: v.optional(v.number()),
		publishedByUserId: v.optional(v.id("users")),
		/** The credit that paid for publishing; a "rerun" can't earn another re-run credit. */
		creditSource: v.optional(creditSource),
		/** When the publishing Founder acknowledged that contributors keep their IP. */
		ipAcknowledgedAt: v.optional(v.number()),
		status: trialStatus,
		participantCount: v.number(),
		searchText: v.string(),
	})
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"])
		.index("by_role", ["roleId"])
		.index("by_status", ["status"])
		.searchIndex("search_trials", {
			searchField: "searchText",
			filterFields: ["status"],
		}),

	/** Template Pulses a Founder defines; copied onto each Participant's Board. */
	challenges: defineTable({
		trialCycleId: v.id("trialCycles"),
		startupId: v.id("startups"),
		title: v.string(),
		description: v.optional(v.string()),
		createdByUserId: v.id("users"),
	}).index("by_trial", ["trialCycleId"]),

	applications: defineTable({
		userId: v.id("users"),
		startupId: v.id("startups"),
		roleId: v.id("roles"),
		trialCycleId: v.id("trialCycles"),
		status: applicationStatus,
		message: v.optional(v.string()),
		/** Set when a Participant leaves after the Trial Cycle started. */
		leftAt: v.optional(v.number()),
		verdict: v.optional(trialVerdict),
		evaluation: v.optional(v.string()),
		/** The Participant chose to show the Evaluation on their profile. */
		evaluationPublic: v.optional(v.boolean()),
	})
		.index("by_user", ["userId"])
		.index("by_startup", ["startupId"])
		.index("by_role", ["roleId"])
		.index("by_trial", ["trialCycleId"])
		.index("by_trial_and_user", ["trialCycleId", "userId"]),

	offers: defineTable({
		applicationId: v.id("applications"),
		trialCycleId: v.id("trialCycles"),
		roleId: v.id("roles"),
		startupId: v.id("startups"),
		userId: v.id("users"),
		status: offerStatus,
	})
		.index("by_role_and_status", ["roleId", "status"])
		.index("by_user_and_status", ["userId", "status"])
		.index("by_startup", ["startupId"])
		.index("by_startup_and_status", ["startupId", "status"]),

	/**
	 * A message in one Participant's Thread with the Founders, or, without
	 * `participantUserId`, an Announcement to every Participant (ADR 0003).
	 */
	trialMessages: defineTable({
		trialCycleId: v.id("trialCycles"),
		/** The author: the Participant, or the Founder replying or announcing. */
		userId: v.id("users"),
		participantUserId: v.optional(v.id("users")),
		body: v.string(),
	}).index("by_trial_and_participant", ["trialCycleId", "participantUserId"]),
	/**
	 * One row per hackathon credit, whatever it came from (eng review D2).
	 * A credit pays for publishing one Trial Cycle.
	 */
	hackathonCredits: defineTable({
		/** Unset until someone claims a launch or UPI code. */
		ownerUserId: v.optional(v.id("users")),
		source: creditSource,
		/** Launch and UPI codes, stored lowercase without spaces or dashes. */
		code: v.optional(v.string()),
		/** Who Engin handed a code to, e.g. "IIT-M E-cell session". */
		issuedTo: v.optional(v.string()),
		claimedAt: v.optional(v.number()),
		/**
		 * One credit per key, because webhooks repeat:
		 * `pro_monthly:{userId}:{YYYY-MM}`, `purchase:{paymentId}`, `rerun:{trialCycleId}`.
		 */
		grantKey: v.optional(v.string()),
		expiresAt: v.optional(v.number()),
		spentAt: v.optional(v.number()),
		spentOnTrialCycleId: v.optional(v.id("trialCycles")),
	})
		.index("by_owner_and_spent", ["ownerUserId", "spentAt"])
		.index("by_code", ["code"])
		.index("by_grant_key", ["grantKey"])
		.index("by_source", ["source"]),
});
