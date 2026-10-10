import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MentorNote } from "~/components/shared/MentorNote";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { displayName } from "~/features/work/cards/displayName";
import { relativeTime } from "~/features/work/cards/relativeTime";
import { initials } from "~/lib/initials";
import { groupMessages } from "./groupMessages";
import type { MessageView } from "./hooks/useMessages";
import { MessageBody } from "./MessageBody";

/** How close to the bottom still counts as reading the latest. */
const STICK_DISTANCE = 80;

/** A clock that ticks every minute, for "2m ago". */
function useNow() {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 60_000);
		return () => clearInterval(id);
	}, []);
	return now;
}

/** The thread's messages in groups by author. Stays at the bottom while you're there. */
export function MessageList({
	messages,
	userId,
}: {
	readonly messages: MessageView[] | undefined;
	readonly userId: string;
}) {
	const scroller = useRef<HTMLDivElement>(null);
	const isNearBottom = useRef(true);
	const [viewing, setViewing] = useState<string | null>(null);
	const now = useNow();
	const newest = messages?.at(-1);

	function scrollToBottom() {
		const el = scroller.current;
		if (el) el.scrollTop = el.scrollHeight;
	}

	// New messages keep you at the bottom, and your own always bring you there.
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs when the newest message changes
	useLayoutEffect(() => {
		if (isNearBottom.current || newest?.author._id === userId) {
			scrollToBottom();
		}
	}, [newest?._id, newest?.author._id, userId]);

	if (messages === undefined) {
		return (
			<div className="flex flex-1 flex-col gap-3 p-4">
				<Skeleton className="h-10 w-3/4" />
				<Skeleton className="h-10 w-1/2" />
			</div>
		);
	}
	if (messages.length === 0) {
		return (
			<div className="flex-1 p-4">
				<MentorNote>Talk here. Mention a Card with #.</MentorNote>
			</div>
		);
	}

	return (
		<>
			<div
				ref={scroller}
				className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
				onScroll={(e) => {
					const el = e.currentTarget;
					isNearBottom.current =
						el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_DISTANCE;
				}}
				// Images change the height when they load.
				onLoadCapture={() => {
					if (isNearBottom.current) scrollToBottom();
				}}
			>
				{groupMessages(messages).map((group) => (
					<div key={group.messages[0]._id} className="flex gap-2.5">
						<Avatar className="size-7">
							{group.author.image ? (
								<AvatarImage src={group.author.image} alt="" />
							) : null}
							<AvatarFallback className="text-[10px]">
								{initials(group.author.name, group.author.username)}
							</AvatarFallback>
						</Avatar>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="flex items-baseline gap-2">
								<span className="truncate text-sm font-medium">
									{displayName(group.author)}
								</span>
								<span className="shrink-0 text-xs text-muted-foreground">
									{relativeTime(group.at, now)}
								</span>
							</div>
							{group.messages.map((message) => (
								<div key={message._id} className="flex flex-col gap-1.5">
									{message.body ? (
										<MessageBody
											body={message.body}
											mentions={message.mentions}
										/>
									) : null}
									{message.imageUrls.length > 0 ? (
										<div className="flex flex-wrap gap-1.5">
											{message.imageUrls.map((url) => (
												<button
													key={url}
													type="button"
													aria-label="Open image"
													className="size-20 overflow-hidden rounded-md border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
													onClick={() => setViewing(url)}
												>
													<img
														src={url}
														alt=""
														className="size-full object-cover"
													/>
												</button>
											))}
										</div>
									) : null}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
			<Dialog
				open={viewing !== null}
				onOpenChange={(isOpen) => !isOpen && setViewing(null)}
			>
				<DialogContent
					aria-describedby={undefined}
					className="w-auto max-w-[90vw] p-2 sm:max-w-[90vw]"
				>
					<DialogTitle className="sr-only">Image</DialogTitle>
					{viewing ? (
						<img
							src={viewing}
							alt=""
							className="max-h-[80dvh] max-w-full rounded-md object-contain"
						/>
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}
