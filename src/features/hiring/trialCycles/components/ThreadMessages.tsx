import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Badge } from "~/components/ui/badge";
import { MessageComposer } from "./MessageComposer";

type ThreadMessagesProps = {
	readonly trialCycleId: Id<"trialCycles">;
	/** Founders name the Participant whose Thread they open. */
	readonly participantUserId?: Id<"users">;
	/** False once the Trial Cycle has closed: Threads are then read-only. */
	readonly canPost: boolean;
	readonly emptyText: string;
};

export function ThreadMessages({
	trialCycleId,
	participantUserId,
	canPost,
	emptyText,
}: ThreadMessagesProps) {
	const messages = useQuery(api.hiring.trialMessages.list, {
		trialCycleId,
		participantUserId,
	});
	const send = useMutation(api.hiring.trialMessages.send);

	return (
		<div className="space-y-4">
			{messages === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : messages.length === 0 ? (
				<p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
					{emptyText}
				</p>
			) : (
				<ul className="space-y-2">
					{messages.map((message) => (
						<li
							key={message._id}
							className={
								message.isAnnouncement
									? "rounded-lg border bg-muted/30 p-3"
									: "rounded-lg border p-3"
							}
						>
							<p className="flex items-center gap-2 text-sm font-medium">
								{message.user?.name ?? message.user?.username ?? "Someone"}
								{message.isAnnouncement ? (
									<Badge variant="secondary">Announcement</Badge>
								) : null}
							</p>
							<p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
						</li>
					))}
				</ul>
			)}
			{canPost ? (
				<MessageComposer
					placeholder="Write a message"
					submitLabel="Send"
					onSend={(body) => send({ trialCycleId, participantUserId, body })}
				/>
			) : (
				<p className="text-sm text-muted-foreground">
					This Trial Cycle is closed, so the Thread is read-only.
				</p>
			)}
		</div>
	);
}
