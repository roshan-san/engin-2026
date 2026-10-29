/** A Participant's phone-picker label: their name, then what the desktop list shows. A decision wins. */
export function participantOptionLabel(participant: {
	readonly name: string;
	readonly decision: "hired" | "not_this_time" | null;
	readonly reviewCount: number;
	readonly unread: boolean;
}): string {
	if (participant.decision) {
		return `${participant.name} · ${participant.decision === "hired" ? "Hired" : "Not this time"}`;
	}
	const signals = [
		participant.reviewCount > 0 ? `${participant.reviewCount} to review` : null,
		participant.unread ? "unread" : null,
	].filter((signal) => signal !== null);
	return [participant.name, ...signals].join(" · ");
}
