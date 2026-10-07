export const MAX_HACKATHON_PARTICIPANTS = 10;
export const MAX_LISTED_HACKATHONS = 40;
export const MAX_HACKATHON_APPLICATIONS = 50;
export const MAX_STARTER_TASKS = 20;
/** Tasks on one Participant's Board, copied Starter Tasks included. */
export const MAX_BOARD_TASKS = 100;
/** Most recent Announcements read for one Hackathon. */
export const MAX_ANNOUNCEMENTS = 100;
export const MAX_USER_APPLICATIONS = 80;
export const MAX_USER_OFFERS = 50;
/** Unread notifications counted, or marked read at once, for one person. */
export const MAX_UNREAD_NOTIFICATIONS = 200;
/** Threads (Hackathons with Announcements) listed for one person. */
export const MAX_THREADS = 50;
export const MAX_ROLE_OFFERS = 100;
export const MAX_ROLE_HACKATHONS = 100;
/** Live entries one person can hold across hackathons; Pro doesn't raise it. */
export const MAX_LIVE_ENTRIES = 5;

/** Applications that hold one of a person's live-entry slots. */
export const LIVE_ENTRY_STATUSES = ["applied", "accepted"] as const;
export const MAX_PROOF_LINKS = 10;
/** Tasks in one Cycle; carry-over into a Cycle respects it too. */
export const MAX_CYCLE_TASKS = 200;
/** Length of a Cycle's one-line goal. */
export const GOAL_MAX = 140;
/** Cycle Members read for one Cycle. */
export const MAX_CYCLE_MEMBERS = 50;
/** Cycles read for one Startup's Cycles screen. */
export const MAX_LISTED_CYCLES = 50;
export const MAX_USER_TASKS = 200;
export const MAX_STARTUP_FOUNDERS = 10;
export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const MAX_INVITES_PER_EMAIL = 20;
/** A Cycle shows "ending soon" within this window of its end date. */
export const CYCLE_ENDING_SOON_MS = 2 * 24 * 60 * 60 * 1000;
/** Bound on one person's unspent hackathon credits read at once. */
export const MAX_USER_CREDITS = 50;
/** Hackathon credits each Pro month includes; unused ones lapse at month end. */
export const PRO_MONTHLY_CREDITS = 2;
/** Bound on Pro users the daily Pro credit grant reads. */
export const MAX_PRO_USERS_SCAN = 500;

/** A Plan's limits (issue #19). Publishing hackathons is gated by credits, not
 * by the Plan (design: Founder Pro subscription). `null` means unlimited —
 * Convex values cannot encode `Infinity`. */
export type PlanLimits = {
	capacity: number;
	openRoles: number | null;
	members: number;
	stealth: boolean;
};

export const PLAN_LIMITS: { free: PlanLimits; pro: PlanLimits } = {
	free: {
		capacity: 5,
		openRoles: 1,
		members: 5,
		stealth: false,
	},
	pro: {
		capacity: 20,
		openRoles: null,
		members: 50,
		stealth: true,
	},
};

/** The bound on every Plan usage read (roles, Hackathons, Members, Invites, Offers). */
export const MAX_PLAN_USAGE_SCAN = 200;

/** A hackathon with fewer applications than this by its cutoff can earn a re-run. */
export const RERUN_MIN_APPLICATIONS = 3;
export const RERUN_CREDIT_TTL_MS = 60 * 24 * 60 * 60 * 1000;

/** Lengths of free-text profile and Pitch fields. */
export const MAX_BIO = 280;
export const MAX_LOCATION = 80;
export const MAX_PITCH_SECTION = 2000;
export const MAX_TEAM_BLURB = 500;
export const SKILL_LIMITS = { maxItems: 10, maxLength: 32 };
export const TECH_STACK_LIMITS = { maxItems: 12, maxLength: 24 };
/** Startups read for one person's switcher. */
export const MAX_USER_MEMBERSHIPS = 50;
/** Lengths of hackathon (Hackathon) text; the client forms use the same numbers. */
export const HACKATHON_TEXT_LIMITS = {
	title: 120,
	description: 4000,
	prize: 200,
	detail: 2000,
};
/** Lengths of Starter Task text. */
export const STARTER_TASK_TEXT_LIMITS = { title: 120, description: 2000 };
export const ROLE_TEXT_LIMITS = {
	title: 120,
	description: 2000,
	skills: { maxItems: 12, maxLength: 40 },
};
/** Roles read for one Startup's Hiring screen. */
export const MAX_LISTED_ROLES = 50;
