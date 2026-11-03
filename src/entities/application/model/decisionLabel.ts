/** How the Founder's views name a decision: an Offer reads Joined once they take it. */
export function decisionLabel(application: {
	readonly decision: "hired" | "not_this_time" | null;
	readonly joinedAt: number | null;
}): "Joined" | "Offer" | "Not this time" | null {
	if (application.decision === "not_this_time") return "Not this time";
	if (application.decision === "hired") {
		return application.joinedAt === null ? "Offer" : "Joined";
	}
	return null;
}
