import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { MeetingSlot } from "@convex/cycles/rules";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Saves the two weekly meetings. Resolves `false` when it didn't save (the error is toasted). */
export function useSetMeetings(startupId: Id<"startups">) {
	const setMeetings = useMutation(api.cycles.setMeetings);

	return (meetings: {
		opening: MeetingSlot;
		closing: MeetingSlot;
		openingLink: string;
		closingLink: string;
	}) =>
		attempt(() =>
			setMeetings({
				startupId,
				opening: meetings.opening,
				closing: meetings.closing,
				openingLink: meetings.openingLink.trim() || undefined,
				closingLink: meetings.closingLink.trim() || undefined,
			}),
		);
}
