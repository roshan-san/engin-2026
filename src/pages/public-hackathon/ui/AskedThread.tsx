import type { Id } from "@convex/_generated/dataModel";
import { useHackathonThreads } from "~/entities/message";
import { useMe } from "~/entities/person";
import { ThreadPanel } from "~/widgets/chat-panel";

/** The Founder's private thread with an Applicant, once the Founder has asked them something. */
export function AskedThread({
	hackathonId,
	isReadOnly,
}: {
	readonly hackathonId: Id<"hackathons">;
	readonly isReadOnly: boolean;
}) {
	const threads = useHackathonThreads(hackathonId);
	const me = useMe();
	const thread = threads?.find((candidate) => candidate.kind === "private");
	if (!thread || !me) return null;

	return (
		<div className="flex h-96 min-h-0 flex-col overflow-hidden rounded-md border border-border">
			<ThreadPanel
				threadId={thread._id}
				title="The Founder asked you"
				userId={me._id}
				placeholder="Reply to the Founder"
				emptyNote="Only you two see this."
				isReadOnly={isReadOnly}
			/>
		</div>
	);
}
