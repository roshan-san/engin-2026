export const MAX_PARTICIPANTS = 10;
/** Hackathons one Founder may have open, live or deciding at once, across all their Startups. */
export const MAX_OPEN_HACKATHONS = 4;
/** Subscriptions read per Founder; old cancelled ones pile up slowly. */
export const MAX_USER_SUBSCRIPTIONS = 20;
export const MIN_HACKATHON_CARDS = 3;
export const MAX_HACKATHON_CARDS = 5;
export const MAX_SHIPPED_LINKS = 5;
export const MAX_SHIPPED_IMAGES = 5;
export const MAX_MESSAGE_IMAGES = 4;
export const MAX_MESSAGE_MENTIONS = 10;
export const MAX_BOARD_CARDS = 200;
export const MAX_LISTED_HACKATHONS = 50;
/** Startups scanned by Explore, highest Rating first. */
export const EXPLORE_SCAN = 200;
/** Rows Explore returns. */
export const MAX_EXPLORE_ROWS = 50;
export const MAX_APPLICATIONS = 500;
export const MAX_USER_APPLICATIONS = 100;
export const MAX_USER_STARTUPS = 50;
export const MAX_CONTRIBUTORS = 100;
export const MAX_INVITES = 100;
export const MAX_THREADS = 20;
export const MAX_MESSAGES = 100;
/** Activity Cycles per page; Show earlier asks for this many more. */
export const CYCLES_PAGE = 8;
export const MAX_LISTED_CYCLES = 104;
export const MAX_CYCLE_ENTRIES = 100;
/** Verified Cards read for a profile; more shows as "500+". */
export const MAX_PROFILE_ROWS = 500;
/** Verified Cards counted per week; more shows as "50+". */
export const WEEK_COUNT_CAP = 50;
/** Rows rated per scheduled run of the weekly Rating. */
export const RATING_PAGE = 20;

/** How often a tab may announce itself, in ms. */
export const MIN_PRESENCE_INTERVAL_MS = 1_000;
export const MAX_PRESENCE_INTERVAL_MS = 60_000;

const DAY_MS = 24 * 60 * 60 * 1000;
export const INVITE_TTL_MS = 14 * DAY_MS;
/** How long after a Hackathon ends the Founder has to decide. */
export const DECIDE_GRACE_MS = 7 * DAY_MS;

/** Longest allowed text per field. */
export const TEXT = {
	cardTitle: 120,
	notes: 5000,
	shippedLine: 140,
	goal: 140,
	oneLiner: 140,
	startupName: 60,
	problem: 2000,
	answer: 1000,
	participantsGet: 140,
	feedback: 280,
	walkthroughNotes: 2000,
	message: 2000,
	bio: 280,
	sessionId: 64,
};

export const STARTING_RATING = 1000;
