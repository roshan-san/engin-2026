import type { Id } from "@convex/_generated/dataModel";
import { ThreadPanel } from "~/features/chat";
import { useHackathonThreads } from "./useSpace";

/** # Everyone for the Founder: answer questions, pin what matters. */
export function EveryonePanel({
	hackathonId,
	userId,
	isReadOnly = false,
}: {
	readonly hackathonId: Id<"hackathons">;
	readonly userId: Id<"users">;
	readonly isReadOnly?: boolean;
}) {
	const threads = useHackathonThreads(hackathonId);
	const everyone = threads?.find((thread) => thread.kind === "everyone");

	return (
		<ThreadPanel
			threadId={everyone?._id}
			title="# Everyone"
			userId={userId}
			placeholder="Message Everyone"
			emptyNote="Answer questions here. Pin what matters."
			canPin={!isReadOnly}
			isReadOnly={isReadOnly}
		/>
	);
}
