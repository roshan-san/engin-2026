export const MAX_TRIAL_PARTICIPANTS = 10;
export const MAX_LISTED_TRIALS = 40;
export const MAX_TRIAL_APPLICATIONS = 50;
export const MAX_TRIAL_CHALLENGES = 20;
/** Pulses on one Participant's Board, seeded Challenges included. */
export const MAX_BOARD_PULSES = 100;
/** Most recent messages read from a Thread, and again from the Announcements. */
export const MAX_THREAD_MESSAGES = 200;
export const MAX_USER_APPLICATIONS = 80;
export const MAX_USER_OFFERS = 50;
export const MAX_ROLE_OFFERS = 100;
export const MAX_ROLE_TRIALS = 100;
export const FREE_ACTIVE_TRIAL_APPLICATIONS = 3;

/** Applications that hold one of a free account's entry slots. */
export const LIVE_ENTRY_STATUSES = ["applied", "joined"] as const;
export const MAX_PROOF_LINKS = 10;
export const MAX_USER_PULSES = 200;
export const MAX_STARTUP_FOUNDERS = 10;
export const MAX_CYCLE_MEMBERS = 50;
export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const MAX_INVITES_PER_EMAIL = 20;
/** A Cycle shows "ending soon" within this window of its end date. */
export const CYCLE_ENDING_SOON_MS = 2 * 24 * 60 * 60 * 1000;
/** Bound on one person's unspent hackathon credits read at once. */
export const MAX_USER_CREDITS = 50;
/** Free launch codes Engin may create per window (design: Free allowance). */
export const MAX_LAUNCH_CODES = 10;
export const LAUNCH_CODE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

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

/** The bound on every Plan usage read (roles, Trial Cycles, Members, Invites, Offers). */
export const MAX_PLAN_USAGE_SCAN = 200;

/** A hackathon with fewer applications than this by its cutoff can earn a re-run. */
export const RERUN_MIN_APPLICATIONS = 3;
export const RERUN_CREDIT_TTL_MS = 60 * 24 * 60 * 60 * 1000;
