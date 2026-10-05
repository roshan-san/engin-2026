import type { Doc } from "@convex/_generated/dataModel";
import type { TrialStatus } from "~/features/hiring/trialCycles/constants";

export type EntryStatus = Doc<"applications">["status"];

/** What a contributor reads for their own entry. */
export const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
	applied: "Applied",
	joined: "Accepted",
	rejected: "Not accepted",
	withdrawn: "Withdrawn",
	left: "Left",
	completed: "Completed",
};

/** An entry's label, given where its hackathon is: running or cancelled reads differently. */
export function entryStatusLabel(
	status: EntryStatus,
	trialStatus: TrialStatus | null,
): string {
	const isIn = status === "applied" || status === "joined";
	if (isIn && trialStatus === "cancelled") {
		return "Hackathon cancelled";
	}
	if (status === "joined" && trialStatus === "active") {
		return "In progress";
	}
	return ENTRY_STATUS_LABELS[status];
}
