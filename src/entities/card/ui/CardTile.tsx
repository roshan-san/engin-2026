import { useDraggable } from "@dnd-kit/core";
import { cn } from "~/shared/lib/cn";
import { Badge } from "~/shared/ui/badge";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import { useBoardScope } from "../model/BoardScope";
import type { CardView } from "../model/types";

/** A tile's frame, shared by the Board and the dragged copy. */
export const TILE_CLASS =
	"relative rounded-md border border-border bg-card px-3 py-2.5 text-card-foreground";

/** What a Card looks like, on the Board and while it's dragged. */
export function CardFace({ card }: { readonly card: CardView }) {
	// A Participant's Board is one person's: their face on every Card says nothing.
	const owner = useBoardScope().kind === "startup" ? card.owner : null;
	const showsBadges = card.changesAsked || card.selfVerified;

	return (
		<>
			{card.changesAsked ? (
				<span
					aria-hidden
					className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-warning"
				/>
			) : null}
			<div className="flex items-start gap-2">
				<p className="line-clamp-3 min-w-0 flex-1 text-sm break-words">
					{card.title}
				</p>
				{owner ? (
					<PersonAvatar person={owner} size={20} className="mt-px" />
				) : null}
			</div>
			{showsBadges ? (
				<div className="mt-2 flex flex-wrap gap-1.5">
					{card.changesAsked ? (
						<Badge variant="status" tone="warning">
							Changes asked
						</Badge>
					) : null}
					{card.selfVerified ? (
						<Badge variant="outline" className="text-muted-foreground">
							Self-verified
						</Badge>
					) : null}
				</div>
			) : null}
		</>
	);
}

/** One draggable Card; click or Enter opens it. */
export function CardTile({
	card,
	isOpen,
	onOpen,
}: {
	readonly card: CardView;
	/** Open in the side panel. */
	readonly isOpen: boolean;
	readonly onOpen: (cardId: string) => void;
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: card._id,
		disabled: card.status === "done",
	});

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: dnd-kit adds role=button and tabIndex
		// biome-ignore lint/a11y/useKeyWithClickEvents: Enter opens the focused Card in useBoardKeys
		<div
			ref={setNodeRef}
			data-card-id={card._id}
			aria-current={isOpen ? "true" : undefined}
			{...attributes}
			// Done Cards can't be dragged but still open, so they aren't "disabled".
			aria-disabled={false}
			{...listeners}
			onClick={() => onOpen(card._id)}
			className={cn(
				TILE_CLASS,
				"shrink-0 cursor-pointer transition-colors select-none [-webkit-touch-callout:none] hover:border-input focus-ring",
				// Done is this week's record: quieter, an outline rather than a tile.
				card.status === "done" && "bg-transparent",
				isOpen && "border-foreground/30 bg-accent/60",
				isDragging && "opacity-40",
			)}
		>
			<CardFace card={card} />
		</div>
	);
}
