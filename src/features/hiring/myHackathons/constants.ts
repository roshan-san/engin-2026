import type { Doc } from "@convex/_generated/dataModel";
import type { HackathonStatus } from "~/features/hiring/hackathons/constants";

export type ApplicationStatus = Doc<"applications">["status"];

/** What a contributor reads for their own entry. */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
	applied: "Applied",
	accepted: "Accepted",
	rejected: "Not accepted",
	withdrawn: "Withdrawn",
	left: "Left",
	completed: "Completed",
};

/** An entry's label, given where its hackathon is: running or cancelled reads differently. */
export function applicationStatusLabel(
	status: ApplicationStatus,
	hackathonStatus: HackathonStatus | null,
): string {
	const isIn = status === "applied" || status === "accepted";
	if (isIn && hackathonStatus === "cancelled") {
		return "Hackathon cancelled";
	}
	if (status === "accepted" && hackathonStatus === "active") {
		return "In progress";
	}
	return APPLICATION_STATUS_LABELS[status];
}
