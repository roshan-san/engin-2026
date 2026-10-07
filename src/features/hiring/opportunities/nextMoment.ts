type Schedule = {
	readonly deadline: number;
	readonly startsAt: number;
	readonly endsAt: number;
};

export type NextMoment = {
	readonly label: "Applications close" | "Starts" | "Ends";
	readonly at: number;
};

/** The first of deadline, start and end that is still ahead of `now`, or null once all have passed. */
export function nextMoment(
	hackathon: Schedule,
	now: number,
): NextMoment | null {
	if (hackathon.deadline > now) {
		return { label: "Applications close", at: hackathon.deadline };
	}
	if (hackathon.startsAt > now) {
		return { label: "Starts", at: hackathon.startsAt };
	}
	if (hackathon.endsAt > now) {
		return { label: "Ends", at: hackathon.endsAt };
	}
	return null;
}
