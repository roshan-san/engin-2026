export function decisionTitle(
	decision: "hired" | "not_this_time",
): "Offer." | "Not this time." {
	return decision === "hired" ? "Offer." : "Not this time.";
}
