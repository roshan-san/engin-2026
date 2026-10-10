import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { CardTile } from "./CardTile";
import type { Column } from "./dropRules";
import type { CardView } from "./types";

/** One Board column: a label with its count, an optional header slot, then its Cards. */
export function BoardColumn({
	id,
	label,
	cards,
	isDragging,
	onOpen,
	children,
}: {
	readonly id: Column;
	readonly label: string;
	readonly cards: readonly CardView[];
	readonly isDragging: boolean;
	readonly onOpen: (cardId: string) => void;
	readonly children?: ReactNode;
}) {
	const { setNodeRef, isOver } = useDroppable({ id });
	const isVerifyOnly = id === "done";

	const zone = (
		<section
			ref={setNodeRef}
			data-column={id}
			aria-label={label}
			className={cn(
				"flex min-h-40 w-72 shrink-0 flex-col gap-2 self-start rounded-xl border border-border bg-muted/30 p-2 md:w-auto md:min-w-52 md:flex-1",
				isVerifyOnly && isDragging && "border-dashed opacity-60",
				!isVerifyOnly && isDragging && isOver && "border-ring bg-accent/30",
			)}
		>
			<h2 className="flex items-center gap-2 px-1 text-sm font-medium">
				{label}
				<span className="text-xs font-normal text-muted-foreground">
					{cards.length}
				</span>
			</h2>
			{children}
			{cards.map((card) => (
				<CardTile key={card._id} card={card} onOpen={onOpen} />
			))}
		</section>
	);

	if (!isVerifyOnly) return zone;

	return (
		<Tooltip open={isDragging}>
			<TooltipTrigger asChild>{zone}</TooltipTrigger>
			<TooltipContent>Only Verify moves here</TooltipContent>
		</Tooltip>
	);
}
