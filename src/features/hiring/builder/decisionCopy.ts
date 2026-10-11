export function decisionTitle(
	decision: "hired" | "not_this_time",
): "Hired." | "Not this time." {
	return decision === "hired" ? "Hired." : "Not this time.";
}
