import type { Id } from "@convex/_generated/dataModel";
import { useAnnouncements } from "~/features/hiring/hackathons/hooks/useAnnouncements";
import { AnnouncementList } from "./AnnouncementList";
import { MessageComposer } from "./MessageComposer";

type HackathonAnnouncementsProps = {
	readonly hackathonId: Id<"hackathons">;
	/** A Founder, while the hackathon is open or running. */
	readonly canPost: boolean;
};

/** Founder news to every Participant; there are no private messages. */
export function HackathonAnnouncements({
	hackathonId,
	canPost,
}: HackathonAnnouncementsProps) {
	const { announcements, post } = useAnnouncements(hackathonId, true);

	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold">Announcements</h2>
				<p className="text-sm text-muted-foreground">
					From the Founders to every Participant.
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
