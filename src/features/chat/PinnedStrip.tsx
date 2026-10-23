import { splitBody } from "@convex/shared/mentions";
import { PinIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { PersonName } from "~/features/people";
import type { MessageView } from "./useMessages";

/** The Founder's pinned messages on top of the thread: the newest, or all of them. */
export function PinnedStrip({
	pinned,
	onUnpin,
}: {
	readonly pinned: MessageView[] | undefined;
	/** The Founder only. */
	readonly onUnpin?: (messageId: MessageView["_id"]) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	if (!pinned || pinned.length === 0) return null;

	const shown = isOpen ? [...pinned].reverse() : pinned.slice(-1);

	return (
		<section
			aria-label="Pinned"
			className="flex max-h-60 shrink-0 flex-col gap-2 overflow-y-auto border-b border-border bg-muted/30 px-4 py-2.5"
		>
			{shown.map((message) => (
				<div key={message._id} className="flex items-start gap-2 text-sm">
					<PinIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
					<p className="min-w-0 flex-1 break-words whitespace-pre-wrap">
						<PersonName person={message.author} className="font-medium" />{" "}
						{message.body
							? splitBody(message.body).map((part, index) =>
									// Only Everyone pins; its mentions never resolve, so they read as plain #card.
									part.kind === "text" ? (
										// biome-ignore lint/suspicious/noArrayIndexKey: parts never reorder
										<span key={index}>{part.text}</span>
									) : (
										// biome-ignore lint/suspicious/noArrayIndexKey: parts never reorder
										<span key={index} className="text-muted-foreground">
											#card
										</span>
									),
								)
							: "Image"}
					</p>
					{onUnpin ? (
						<Button
							variant="ghost"
							size="sm"
							className="h-6 px-2 text-xs pointer-coarse:h-8 pointer-coarse:min-w-8"
							onClick={() => onUnpin(message._id)}
						>
							Unpin
						</Button>
					) : null}
				</div>
			))}
			{pinned.length > 1 ? (
				<button
					type="button"
					className="self-start text-xs text-muted-foreground hover:text-foreground focus-ring"
					onClick={() => setIsOpen(!isOpen)}
				>
					{isOpen ? "Show less" : `${pinned.length} pinned`}
				</button>
			) : null}
		</section>
	);
}
