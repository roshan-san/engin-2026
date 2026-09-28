import type { Id } from "@convex/_generated/dataModel";
import { FounderThreads } from "./FounderThreads";
import { ThreadMessages } from "./ThreadMessages";

type TrialChatProps = {
	readonly trialCycleId: Id<"trialCycles">;
	readonly isFounder: boolean;
	readonly canPost: boolean;
};

/** Founders get the list of Threads; a Participant gets their own Thread. */
export function TrialChat({
	trialCycleId,
	isFounder,
	canPost,
}: TrialChatProps) {
	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">
				{isFounder ? "Threads" : "Messages"}
			</h2>
			{isFounder ? (
				<FounderThreads trialCycleId={trialCycleId} canPost={canPost} />
			) : (
				<ThreadMessages
					trialCycleId={trialCycleId}
					canPost={canPost}
					emptyText="No messages yet. Only you and the Founders can see this Thread."
				/>
			)}
		</section>
	);
}
