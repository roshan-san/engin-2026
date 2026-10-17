import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { EmptyState } from "~/components/EmptyState";
import { cn } from "~/lib/utils";
import { useBoardScope } from "./BoardScope";
import { CardTile } from "./CardTile";
import { ColumnIcon } from "./ColumnIcon";
import type { Column } from "./dropRules";
import type { CardView } from "./types";

/**
 * While a Card is dragged, what this column would do with it: `"accept"` it,
 * `"refuse"` it, or nothing (`"idle"`: no drag, or the Card's own column).
 */
export type DropState = "idle" | "accept" | "refuse";

/** What an empty column says. Hackathon Cards come ready-made, so there is nothing to add there. */
function emptyTitle(column: Column, canAddCards: boolean) {
	switch (column) {
		case "todo":
			return canAddCards ? "Add a Card to start" : "Nothing left to start";
		case "in_progress":
			return "Move a Card here when you start";
		case "review":
			return "Cards land here once What shipped is in";
		case "done":
			return "Verified Cards end up here";
	}
}

/** One Board column: its glyph, label and count, an optional header slot, then its Cards. */
export function BoardColumn({
	id,
	label,
	cards,
	dropState,
	openCardId,
	onOpen,
	children,
}: {
	readonly id: Column;
	readonly label: string;
	readonly cards: readonly CardView[];
	readonly dropState: DropState;
	readonly openCardId: string | undefined;
	readonly onOpen: (cardId: string) => void;
	readonly children?: ReactNode;
}) {
	const { setNodeRef, isOver } = useDroppable({ id });
	const canAddCards = useBoardScope().kind === "startup";

	return (
		<section
			ref={setNodeRef}
			data-column={id}
			aria-label={label}
			// Focusable by code only: where focus lands when its last Card is gone.
			tabIndex={-1}
			className={cn(
				"flex w-72 shrink-0 snap-start flex-col rounded-lg bg-muted/25 outline-none transition-[opacity,background-color,box-shadow] duration-150 md:w-auto md:min-w-44 md:flex-1",
				dropState === "refuse" && "opacity-40",
				dropState === "accept" && isOver && "bg-accent/50 ring-1 ring-ring/50",
			)}
		>
			<h2 className="flex h-10 shrink-0 items-center gap-2 px-3 text-sm font-medium">
				<ColumnIcon column={id} />
				{label}
				<span className="text-xs font-normal text-subtle-foreground tabular-nums">
					{cards.length}
				</span>
			</h2>
			<div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pt-0.5 pb-1.5">
				{children}
				{cards.map((card) => (
					<CardTile
						key={card._id}
						card={card}
						isOpen={card._id === openCardId}
						onOpen={onOpen}
					/>
				))}
				{cards.length === 0 ? (
					<EmptyState size="compact" title={emptyTitle(id, canAddCards)} />
				) : null}
			</div>
		</section>
	);
}
