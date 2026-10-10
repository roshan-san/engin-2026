import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";
import type { CardView } from "./types";

/** What a Card looks like, on the Board and while it's dragged. */
export function CardFace({ card }: { readonly card: CardView }) {
	const { owner } = card;
	const showsBadges = card.changesAsked || card.selfVerified;

	return (
		<>
			<div className="flex items-start gap-2">
				<p className="min-w-0 flex-1 text-sm break-words">{card.title}</p>
				{owner ? (
					<Avatar className="size-6" title={owner.name ?? owner.username ?? ""}>
						{owner.image ? <AvatarImage src={owner.image} alt="" /> : null}
						<AvatarFallback className="text-[10px]">
							{initials(owner.name, owner.username)}
						</AvatarFallback>
					</Avatar>
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
						<Badge variant="outline">Self-verified</Badge>
					) : null}
				</div>
			) : null}
		</>
	);
}

/** One draggable Card; click or Enter opens it. */
export function CardTile({
	card,
	onOpen,
}: {
	readonly card: CardView;
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
			{...attributes}
			{...listeners}
			onClick={() => onOpen(card._id)}
			className={cn(
				"cursor-pointer rounded-lg border border-border bg-card p-3 text-card-foreground outline-none select-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/60",
				isDragging && "opacity-40",
			)}
		>
			<CardFace card={card} />
		</div>
	);
}
