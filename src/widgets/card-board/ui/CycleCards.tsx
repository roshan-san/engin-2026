import {
	CardFace,
	COLUMNS,
	NewCardInput,
	TILE_CLASS,
	useBoardCards,
	useBoardScope,
} from "~/entities/card";
import { useCreateCard } from "~/features/create-card";
import { cn } from "~/shared/lib/cn";
import { Skeleton } from "~/shared/ui/skeleton";
import { cycleCardOrder } from "../model/cycleCardOrder";
import { useCardBoard } from "./CardBoard";

/** The Board's Cards as one list, each saying which column it's in. Open one to move it. */
export function CycleCards() {
	const { openCardId, open } = useCardBoard();
	const scope = useBoardScope();
	const cards = useBoardCards(scope);
	const create = useCreateCard(scope);

	return (
		<div className="flex flex-col gap-2">
			<NewCardInput
				shortcut={null}
				note="Three to five Cards is a good week."
				onCreate={create}
			/>
			{cards === undefined ? (
				<>
					<Skeleton className="h-12" />
					<Skeleton className="h-12" />
				</>
			) : (
				cycleCardOrder(cards).map((card) => (
					<button
						key={card._id}
						type="button"
						aria-current={card._id === openCardId ? "true" : undefined}
						onClick={() => open(card._id)}
						className={cn(
							TILE_CLASS,
							"w-full cursor-pointer text-left transition-colors hover:border-input focus-ring",
							card.status === "done" && "bg-transparent",
							card._id === openCardId && "border-foreground/30 bg-accent/60",
						)}
					>
						<CardFace card={card} />
						<span className="mt-1.5 block text-xs text-muted-foreground">
							{COLUMNS.find((column) => column.id === card.status)?.label}
						</span>
					</button>
				))
			)}
		</div>
	);
}
