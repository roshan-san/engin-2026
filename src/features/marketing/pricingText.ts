import { PLANS, type PlanKey } from "@convex/shared/plans";

/** Each Pro plan as the Landing page says it. */
export function planLines() {
	return (Object.keys(PLANS) as PlanKey[]).map((key) => {
		const plan = PLANS[key];
		return {
			key,
			name: plan.name,
			price: `$${plan.priceUsd}`,
			per: plan.months === 1 ? "per month" : `per ${plan.months} months`,
			hackathons: `${plan.hackathonsPerPeriod} ${plan.hackathonsPerPeriod === 1 ? "hackathon" : "hackathons"} to publish`,
		};
	});
}
