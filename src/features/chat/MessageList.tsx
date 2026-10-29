import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { relativeTime } from "~/shared/lib/dates";
import { Button } from "~/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/shared/ui/dialog";
import { MentorNote } from "~/shared/ui/MentorNote";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import { PersonName } from "~/shared/ui/PersonName";
import { Skeleton } from "~/shared/ui/skeleton";
import { groupMessages } from "./groupMessages";
import { MessageBody } from "./MessageBody";
import type { MessageView } from "./useMessages";

/** How close to the bottom still counts as reading the latest. */
const STICK_DISTANCE = 80;

/** A message group's exact time, on hover: "Sun, Oct 11, 4:05 PM". */
const FULL_TIME = new Intl.DateTimeFormat("en-US", {
	weekday: "short",
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

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
	slug,
	emptyNote,
	onPin,
}: {
	readonly messages: MessageView[] | undefined;
	readonly userId: string;
	/** The Startup whose Board Card mentions open; Team threads only. */
	readonly slug?: string;
	readonly emptyNote: string;
	/** The Founder pins a message in Everyone. Absent where pinning isn't allowed. */
	readonly onPin?: (messageId: MessageView["_id"]) => void;
}) {
	const scroller = useRef<HTMLDivElement>(null);
	const isNearBottom = useRef(true);
	const [viewing, setViewing] = useState<string | null>(null);
	// A newer message landed while the reader was scrolled up.
	const [hasNewBelow, setHasNewBelow] = useState(false);
	const now = useNow();
	const newest = messages?.at(-1);

	function scrollToBottom() {
		const el = scroller.current;
		if (el) el.scrollTop = el.scrollHeight;
	}

	// New messages keep you at the bottom, and your own always bring you there.
	// Scrolled up, a pill offers the way down instead of moving you.
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs when the newest message changes
	useLayoutEffect(() => {
		if (isNearBottom.current || newest?.author._id === userId) {
			scrollToBottom();
			setHasNewBelow(false);
		} else {
			setHasNewBelow(true);
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
			<div className="flex flex-1 items-center justify-center p-6 text-center">
				<MentorNote>{emptyNote}</MentorNote>
			</div>
		);
	}

	return (
		<>
			<div className="relative flex min-h-0 flex-1 flex-col">
				<div
					ref={scroller}
					role="log"
					aria-live="polite"
					// Only new messages are read out, not the "2m ago" labels ticking over.
					aria-relevant="additions"
					// The New messages pill hands focus here as it goes.
					tabIndex={-1}
					className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 focus-ring"
					onScroll={(e) => {
						const el = e.currentTarget;
						isNearBottom.current =
							el.scrollHeight - el.scrollTop - el.clientHeight <=
							STICK_DISTANCE;
						if (isNearBottom.current) setHasNewBelow(false);
					}}
					// Images change the height when they load.
					onLoadCapture={() => {
						if (isNearBottom.current) scrollToBottom();
					}}
				>
					{groupMessages(messages).map((group) => (
						<div key={group.messages[0]._id} className="flex gap-2.5">
							<PersonAvatar
								person={group.author}
								size={32}
								className="mt-0.5"
							/>
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="flex items-baseline gap-2">
									<PersonName
										person={group.author}
										className="truncate text-sm font-medium"
									/>
									<time
										dateTime={new Date(group.at).toISOString()}
										title={FULL_TIME.format(group.at)}
										className="shrink-0 text-xs text-subtle-foreground"
									>
										{relativeTime(group.at, now)}
									</time>
								</div>
								{group.messages.map((message) => (
									<div
										key={message._id}
										className="group/message relative flex flex-col gap-1.5"
									>
										{onPin && !message.pinned ? (
											<Button
												variant="ghost"
												size="sm"
												className="absolute -top-1 right-0 h-6 px-2 text-xs opacity-0 group-hover/message:opacity-100 focus-visible:opacity-100 pointer-coarse:h-8 pointer-coarse:min-w-8 pointer-coarse:opacity-100"
												onClick={() => onPin(message._id)}
											>
												Pin
											</Button>
										) : null}
										{message.body ? (
											<MessageBody
												body={message.body}
												mentions={message.mentions}
												slug={slug}
											/>
										) : null}
										{message.imageUrls.length > 0 ? (
											<div className="flex flex-wrap gap-1.5">
												{message.imageUrls.map((url) => (
													<button
														key={url}
														type="button"
														aria-label="Open image"
														className="size-20 overflow-hidden rounded-md border border-border focus-ring"
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
				{hasNewBelow ? (
					<Button
						size="sm"
						className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
						onClick={() => {
							scrollToBottom();
							// The pill goes away; keep keyboard focus in the thread.
							scroller.current?.focus({ preventScroll: true });
							setHasNewBelow(false);
						}}
					>
						New messages ↓
					</Button>
				) : null}
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
