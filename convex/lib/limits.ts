export const MAX_TRIAL_PARTICIPANTS = 10;
export const MAX_LISTED_TRIALS = 40;
export const MAX_TRIAL_APPLICATIONS = 50;
export const MAX_TRIAL_CHALLENGES = 20;
/** Pulses on one Participant's Board, seeded Challenges included. */
export const MAX_BOARD_PULSES = 100;
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
