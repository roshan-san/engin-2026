import type { Infer } from "convex/values";
import { WEEK_MS } from "../cycles/rules";
import { DECIDE_GRACE_MS } from "./limits";
import type { hackathonStatus } from "./validators";

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
