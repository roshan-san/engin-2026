import {
	DEFAULT_PLAN,
	dayLabel,
	PLANS,
	type PlanKey,
	type PlanView,
} from "@convex/shared/plans";

export type PlanLine = {
	key: PlanKey;
	name: string;
	price: string;
	per: string;
	hackathons: string;
	isHighlighted: boolean;
};

/** Each Pro plan as Pricing and the plans dialog say it. */
export function planLines(): PlanLine[] {
	return (Object.keys(PLANS) as PlanKey[]).map((key) => {
		const plan = PLANS[key];
		return {
			key,
			name: plan.name,
			price: `$${plan.priceUsd}`,
			per: plan.months === 1 ? "a month" : `for ${plan.months} months`,
			hackathons:
				plan.months === 1
					? `${plan.hackathonsPerPeriod} Hackathon a month`
					: `${plan.hackathonsPerPeriod} Hackathons upfront`,
			isHighlighted: key === DEFAULT_PLAN,
		};
	});
}

/** "6 months. 14 of 15 Hackathons left until 16 Apr 2027." */
export function planSummary(view: PlanView): string {
	return `${PLANS[view.plan].name}. ${view.hackathonsLeft} of ${view.allowance} Hackathons left until ${dayLabel(view.periodEnd)}.`;
}
