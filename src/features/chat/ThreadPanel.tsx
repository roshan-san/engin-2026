import type { Id } from "@convex/_generated/dataModel";
import { XIcon } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { MessageList, PinnedStrip, useMessages } from "~/entities/message";
import { Composer, useSendMessage } from "~/features/send-message";
import { Button } from "~/shared/ui/button";
import { PanelHeader } from "~/shared/ui/PanelHeader";
import { Skeleton } from "~/shared/ui/skeleton";
import { usePinMessage } from "./usePinMessage";

/** One thread: its pinned messages, the messages and the composer. Mounted only while it shows. */
export function ThreadPanel({
	threadId,
	title,
	userId,
	placeholder,
	emptyNote,
	mentions,
	canPin = false,
	isReadOnly = false,
	actions,
	onClose,
}: {
	/** `undefined` while the thread loads. */
	readonly threadId: Id<"threads"> | undefined;
	/** A heading, or a control that stands in for one (a pane switch). */
	readonly title: ReactNode;
	readonly userId: Id<"users">;
	/** The composer's placeholder: "Message Team". */
	readonly placeholder: string;
	readonly emptyNote: string;
	/** Team threads: `#` mentions this Startup's Board Cards. */
	readonly mentions?: {
		readonly startupId: Id<"startups">;
		readonly slug: string;
	};
	/** The Founder pins and unpins messages (Everyone). */
	readonly canPin?: boolean;
	/** No composer: the thread can be read but not written to. */
	readonly isReadOnly?: boolean;
	/** Shown at the right of the header. */
	readonly actions?: ReactNode;
	/** On a phone, closes the sheet the panel sits in. */
	readonly onClose?: () => void;
}) {
	const { messages, pinned, markRead } = useMessages(threadId);
	const send = useSendMessage(threadId);
	const pin = usePinMessage();
	const newestId = messages?.at(-1)?._id;

	// Read on opening, and again whenever a newer message lands while open.
	// biome-ignore lint/correctness/useExhaustiveDependencies: markRead only needs to run when the thread or newest message changes
	useEffect(() => {
		if (threadId) markRead();
	}, [threadId, newestId]);

	return (
		<div data-testid="threads-panel" className="flex min-h-0 flex-1 flex-col">
			<PanelHeader>
				{typeof title === "string" ? (
					<h2 className="truncate text-sm font-medium">{title}</h2>
				) : (
					title
				)}
				<div className="ml-auto flex items-center gap-2">
					{actions}
					{onClose ? (
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Close"
							onClick={onClose}
						>
							<XIcon />
						</Button>
					) : null}
				</div>
			</PanelHeader>
			{threadId ? (
				<>
					<PinnedStrip
						pinned={pinned}
						onUnpin={
							canPin ? (messageId) => void pin(messageId, false) : undefined
						}
					/>
					<MessageList
						messages={messages}
						userId={userId}
						slug={mentions?.slug}
						emptyNote={emptyNote}
						onPin={
							canPin ? (messageId) => void pin(messageId, true) : undefined
						}
					/>
					{isReadOnly ? (
						<p className="shrink-0 px-4 pb-3 text-sm text-muted-foreground">
							This Hackathon has ended. Chat is read-only.
						</p>
					) : (
						<Composer
							onSend={send}
							placeholder={placeholder}
							mentionStartupId={mentions?.startupId}
						/>
					)}
				</>
			) : (
				<div className="flex flex-col gap-3 p-4">
					<Skeleton className="h-10 w-3/4" />
					<Skeleton className="h-10 w-1/2" />
				</div>
			)}
		</div>
	);
}
