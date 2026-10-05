import type { Id } from "@convex/_generated/dataModel";
import { useAnnouncements } from "~/features/hiring/trialCycles/hooks/useAnnouncements";
import { AnnouncementList } from "./AnnouncementList";
import { MessageComposer } from "./MessageComposer";

type TrialAnnouncementsProps = {
	readonly trialCycleId: Id<"trialCycles">;
	/** A Founder, while the hackathon is open or running. */
	readonly canPost: boolean;
};

/** Founder news to every Participant; there are no private messages. */
export function TrialAnnouncements({
	trialCycleId,
	canPost,
}: TrialAnnouncementsProps) {
	const { announcements, post } = useAnnouncements(trialCycleId, true);

	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold">Announcements</h2>
				<p className="text-sm text-muted-foreground">
					From the founders to every Participant.
				</p>
			</div>
			{canPost ? (
				<MessageComposer
					placeholder="Tell every Participant something"
					submitLabel="Post"
					onSend={post}
				/>
			) : null}
			<AnnouncementList announcements={announcements} />
		</section>
	);
}
