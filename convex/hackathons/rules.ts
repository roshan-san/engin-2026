import { type Infer, v } from "convex/values";
import { WEEK_MS, weekOf, weekStart } from "../cycles/rules";

export type HackathonPhase = Infer<typeof hackathonStatus>;

/** Open, Live or Deciding: published and not yet Done. */
export const RUNNING = ["open", "live", "deciding"] as const;

/**
 * Where a Hackathon is at `now`. A Live Hackathon past its `endsAt` is
 * Deciding, before the scheduled `startDeciding` has caught up.
 */
export function phaseOf(
	hackathon: { readonly status: HackathonPhase; readonly endsAt: number },
	now: number,
): HackathonPhase {
	if (hackathon.status === "live" && now >= hackathon.endsAt) {
		return "deciding";
	}
	return hackathon.status;
}

export function isRunning(phase: HackathonPhase): boolean {
	return (RUNNING as readonly HackathonPhase[]).includes(phase);
}

/** Live or Deciding: started and not yet Done. */
export function isUnderway(phase: HackathonPhase): boolean {
	return phase === "live" || phase === "deciding";
}

/** When a Hackathon starting at `startsAt` ends, and when its decisions are due. */
export function hackathonDates(
	startsAt: number,
	weeks: 1 | 2,
): { endsAt: number; decideBy: number } {
	const endsAt = startsAt + weeks * WEEK_MS;
	return { endsAt, decideBy: endsAt + DECIDE_GRACE_MS };
}

export const MAX_PARTICIPANTS = 10;
export const MIN_HACKATHON_CARDS = 3;
export const MAX_HACKATHON_CARDS = 5;
export const MAX_LISTED_HACKATHONS = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

/** How far ahead a start must be, so Builders have time to apply. */
export const MIN_NOTICE_MS = 3 * DAY_MS;
export const START_MESSAGE = "Start on a Monday at least 3 days away";

/** Whether a Hackathon may start at `startsAt`: a Monday 00:00 IST at least 3 days from `now`. */
export function canStartAt(startsAt: number, now: number): boolean {
	return (
		startsAt === weekStart(weekOf(startsAt)) && startsAt - now >= MIN_NOTICE_MS
	);
}

/** The first two Mondays a Hackathon can start on. */
export function firstStarts(now: number): [number, number] {
	const next = weekStart(weekOf(now)) + WEEK_MS;
	const first = canStartAt(next, now) ? next : next + WEEK_MS;
	return [first, first + WEEK_MS];
}

/** How long after a Hackathon ends the Founder has to decide. */
export const DECIDE_GRACE_MS = 7 * DAY_MS;
export const hackathonStatus = v.union(
	v.literal("draft"),
	v.literal("open"),
	v.literal("live"),
	v.literal("deciding"),
	v.literal("done"),
);
export const jobPay = v.union(
	v.literal("3_6l"),
	v.literal("6_9l"),
	v.literal("9_15l"),
	v.literal("equity"),
	v.literal("unpaid"),
);
export const jobMode = v.union(
	v.literal("remote"),
	v.literal("onsite"),
	v.literal("hybrid"),
);
/** How long a Hackathon runs, in weeks. */
export const hackathonWeeks = v.union(v.literal(1), v.literal(2));

/** What Builders get when nothing is on offer. A Hackathon saved before the choice was required reads as this too. */
export const NOTHING = "Nothing";

/** Whether Builders get something: a value is set and it isn't "Nothing". */
export function isPaid(participantsGet: string | undefined): boolean {
	return participantsGet !== undefined && participantsGet !== NOTHING;
}

/** Longest allowed text per Hackathon field. */
export const HACKATHON_TEXT = {
	title: 60,
	participantsGet: 140,
	problem: 2000,
};

export const MAX_APPLICATIONS = 500;
