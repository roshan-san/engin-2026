import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { MessageComposer } from "./MessageComposer";
import { ThreadMessages } from "./ThreadMessages";

type FounderThreadsProps = {
	readonly trialCycleId: Id<"trialCycles">;
	readonly canPost: boolean;
};

export function FounderThreads({ trialCycleId, canPost }: FounderThreadsProps) {
	const threads = useQuery(api.hiring.trialMessages.threads, { trialCycleId });
	const announce = useMutation(api.hiring.trialMessages.announce);
	const [selected, setSelected] = useState<Id<"users"> | null>(null);

	if (threads === undefined) {
		return <p className="text-sm text-muted-foreground">Loading…</p>;
	}

	return (
		<div className="space-y-4">
			{canPost ? (
				<div className="space-y-2">
					<p className="text-sm font-medium">Announce to every Participant</p>
					<MessageComposer
						placeholder="Write an Announcement"
						submitLabel="Announce"
						onSend={(body) => announce({ trialCycleId, body })}
					/>
				</div>
			) : null}
			{threads.length === 0 ? (
				<p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
					No Participants yet, so there are no Threads.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<ul className="space-y-2">
						{threads.map((thread) => (
							<li key={thread.participantUserId}>
								<Button
									type="button"
									variant="outline"
									onClick={() => setSelected(thread.participantUserId)}
									className={cn(
										"h-auto w-full flex-col items-start gap-1 p-3 text-left",
										selected === thread.participantUserId && "bg-muted",
									)}
								>
									<span className="text-sm font-medium">
										{thread.user?.name ??
											thread.user?.username ??
											"Participant"}
									</span>
									<span className="line-clamp-1 text-xs font-normal text-muted-foreground">
										{thread.latest?.body ?? "No messages yet"}
									</span>
								</Button>
							</li>
						))}
					</ul>
					<div className="md:col-span-2">
						{selected ? (
							<ThreadMessages
								key={selected}
								trialCycleId={trialCycleId}
								participantUserId={selected}
								canPost={canPost}
								emptyText="Nothing here yet. Start the conversation."
							/>
						) : (
							<p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
								Choose a Participant to open their Thread.
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
