// The pure section needs no Convex server imports.
import { shiftWeek, weekOf } from "./cycles.rules";

export const RATING = {
	weeks: 12,
	base: 800,
	span: 800,
	riseStep: 0.25,
	fallStep: 0.1,
	volumeCap: 5,
	volumeBonus: 0.02,
	volumeBonusCap: 10,
	provisionalWeeks: 4,
	outcomeDays: 365,
	outcomePoints: { hired: 1, finalist: 0.5, built: 0.2 },
	startup: { consistency: 0.6, volume: 0.4 },
	person: { consistency: 0.5, volume: 0.3, outcomes: 0.2 },
} as const;

export type Outcome = "built" | "finalist" | "hired";

export type Parts = {
	consistency: number;
	volume: number;
	active: number;
	weeks: number;
	perWeek: number;
};

/** The finished weeks that count, oldest first: at most 12, none before signup. */
export function countedWeeks(createdAt: number, throughWeek: string): string[] {
	const firstWeek = weekOf(createdAt);
	const weeks: string[] = [];
	for (let week = throughWeek; weeks.length < RATING.weeks; ) {
		if (week < firstWeek) break;
		weeks.unshift(week);
		week = shiftWeek(week, -1);
	}
	return weeks;
}

export function weekVolume(n: number): number {
	const full = Math.min(n, RATING.volumeCap) / RATING.volumeCap;
	const extra = Math.min(
		Math.max(n - RATING.volumeCap, 0),
		RATING.volumeBonusCap,
	);
	return full + RATING.volumeBonus * extra;
}

/** The parts from one verified-Card count per counted week. */
export function buildParts(counts: number[]): Parts {
	const weeks = counts.length;
	if (weeks === 0) {
		return { consistency: 0, volume: 0, active: 0, weeks: 0, perWeek: 0 };
	}
	const active = counts.filter((n) => n > 0).length;
	const volume = counts.reduce((sum, n) => sum + weekVolume(n), 0) / weeks;
	const total = counts.reduce((sum, n) => sum + n, 0);
	return {
		consistency: active / weeks,
		volume,
		active,
		weeks,
		perWeek: Math.round((total / weeks) * 10) / 10,
	};
}

export function outcomeOf(a: {
	status: string;
	decision?: string;
	shortlisted: boolean;
}): Outcome | null {
	if (a.status !== "building") return null;
	if (a.decision === "hired") return "hired";
	return a.shortlisted ? "finalist" : "built";
}

export function outcomeScore(outcomes: Outcome[]): number {
	const sum = outcomes.reduce((s, o) => s + RATING.outcomePoints[o], 0);
	return Math.min(sum, 1);
}

function toTarget(score: number): number {
	return RATING.base + RATING.span * score;
}

export function startupTarget(parts: Parts): number {
	const w = RATING.startup;
	return toTarget(w.consistency * parts.consistency + w.volume * parts.volume);
}

export function personTarget(parts: Parts, outcomes: number): number {
	const w = RATING.person;
	return toTarget(
		w.consistency * parts.consistency +
			w.volume * parts.volume +
			w.outcomes * outcomes,
	);
}

/** One week's move toward the target: quick to rise, slow to fall. */
export function nextRating(rating: number, target: number): number {
	const step = target > rating ? RATING.riseStep : RATING.fallStep;
	return Math.round(rating + step * (target - rating));
}

export function toPartsView(parts: Parts) {
	return {
		consistency: { active: parts.active, weeks: parts.weeks },
		volume: { perWeek: parts.perWeek },
	};
}
