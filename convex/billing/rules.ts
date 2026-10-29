import { IST_OFFSET_MS } from "../shared/cycles";
import { MAX_OPEN_HACKATHONS } from "../shared/limits";

/**
 * Pro plans. Pro is hiring only: it lets a Founder publish Hackathons.
 * Prices are USD; Dodo bills each plan as a recurring subscription.
 * Each plan grants `hackathonsPerPeriod` upfront at the start of every billing
 * period. Unused ones don't roll over, and MAX_OPEN_HACKATHONS still applies.
 */
export const PLANS = {
	monthly: {
		name: "Monthly",
		priceUsd: 15,
		months: 1,
		hackathonsPerPeriod: 1,
	},
	six_months: {
		name: "6 months",
		priceUsd: 50,
		months: 6,
		hackathonsPerPeriod: 15,
	},
	yearly: {
		name: "12 months",
		priceUsd: 90,
		months: 12,
		hackathonsPerPeriod: 30,
	},
} as const;

export type PlanKey = keyof typeof PLANS;

/** The plan shown first and selected by default. */
export const DEFAULT_PLAN: PlanKey = "six_months";

/** A Founder's plan as the app sees it. */
export type PlanView = {
	plan: PlanKey;
	/** When the next payment is due, and the allowance renews. */
	periodEnd: number;
	allowance: number;
	hackathonsLeft: number;
	/** Hackathons open, live or deciding, across all their Startups. */
	running: number;
};

/** Why a Founder can't publish a Hackathon right now. */
export type PublishBlock =
	| { reason: "no_pro" }
	| { reason: "used_up"; allowance: number; renewsAt: number }
	| { reason: "too_many_running" };

/** Whether a Founder with this plan may publish; `null` means they may. */
export function publishBlockFor(view: PlanView | null): PublishBlock | null {
	if (!view) {
		return { reason: "no_pro" };
	}
	if (view.hackathonsLeft <= 0) {
		return {
			reason: "used_up",
			allowance: view.allowance,
			renewsAt: view.periodEnd,
		};
	}
	if (view.running >= MAX_OPEN_HACKATHONS) {
		return { reason: "too_many_running" };
	}
	return null;
}

export function publishBlockMessage(block: PublishBlock): string {
	switch (block.reason) {
		case "no_pro":
			return "Publishing needs Pro. Your draft is saved.";
		case "used_up": {
			const published =
				block.allowance === 1
					? "You've published the Hackathon on your plan."
					: `You've published all ${block.allowance} Hackathons on your plan.`;
			return `${published} More on ${dayLabel(block.renewsAt)}.`;
		}
		case "too_many_running":
			return "4 Hackathons are running. Make your Decisions before you open a fifth.";
	}
}

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

/** "16 Apr 2027", in IST. */
export function dayLabel(at: number): string {
	const day = new Date(at + IST_OFFSET_MS);
	return `${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]} ${day.getUTCFullYear()}`;
}
