import type { Trust } from "@convex/momentum/rules";

export type TrustView = {
	readonly trust: Trust;
	readonly held: boolean;
	readonly progress: {
		readonly weeks: number;
		readonly highWeeks: number;
		readonly highStartups: number;
		readonly hackathon: boolean;
	};
};

const LABELS: Record<Trust, "Low" | "Mid" | "High"> = {
	low: "Low",
	mid: "Mid",
	high: "High",
};

export function trustLabel(trust: Trust): "Low" | "Mid" | "High" {
	return LABELS[trust];
}

function nowLine({ trust, progress }: TrustView): string {
	switch (trust) {
		case "low":
			return "Low: your Record isn't confirmed by others yet.";
		case "mid":
			return progress.weeks >= 4 || !progress.hackathon
				? "Mid: others approved your work in 4 different weeks."
				: "Mid: you finished a paid Hackathon where the promise was kept.";
		case "high":
			return "High: Mid or High people at 2 unrelated startups approved your work, across 12 different weeks.";
	}
}

function nextLine({ trust, progress }: TrustView): string | null {
	switch (trust) {
		case "low":
			return `Mid: others approve your work in 4 different weeks (${Math.min(progress.weeks, 4)} of 4), or finish a paid Hackathon where the promise was kept.`;
		case "mid":
			return `High: approval from Mid or High people at 2 unrelated startups (${Math.min(progress.highStartups, 2)} of 2), across 12 different weeks (${Math.min(progress.highWeeks, 12)} of 12).`;
		case "high":
			return null;
	}
}

/** Your Trust in words: the rule you meet now, and what's left for the next level. */
export function trustLines(view: TrustView): {
	now: string;
	next: string | null;
} {
	const now = nowLine(view);
	return {
		now: view.held ? `${now} It's on hold while we review your Record.` : now,
		next: nextLine(view),
	};
}
