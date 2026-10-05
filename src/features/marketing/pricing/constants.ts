/** Per-hackathon prices; must match the Dodo products for each plan. */
export const HACKATHON_PRICE_LABELS = {
	free: "₹2,999",
	pro: "₹1,499",
} as const;

/** Pro subscription prices; must match the monthly and yearly Dodo products. */
export const PRO_PRICE_LABELS = {
	monthly: "₹999",
	yearly: "₹9,999",
} as const;

/** Yearly against twelve monthly payments: 999 × 12 − 9,999. */
export const PRO_YEARLY_SAVING_LABEL = "₹1,989";
