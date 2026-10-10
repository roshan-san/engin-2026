import {
	type CollisionDetection,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	pointerWithin,
	rectIntersection,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "~/components/ui/skeleton";
import { TooltipProvider } from "~/components/ui/tooltip";
import { BoardColumn } from "./BoardColumn";
import { CardFace } from "./CardTile";
import { COLUMNS, type Column, dropAction, dropRefusal } from "./dropRules";
import { useBoard } from "./hooks/useBoard";
import { useBoardKeys } from "./hooks/useBoardKeys";
import { NewCardInput } from "./NewCardInput";
import { useWorkspace } from "./StartupContext";
import type { CardView } from "./types";

const COLUMN_IDS = new Set<string>(COLUMNS.map((column) => column.id));

/** Prefer the column under the pointer; keyboard drags fall back to overlap. */
const collisionDetection: CollisionDetection = (args) => {
	const underPointer = pointerWithin(args);
	return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

/** The four columns of Cards. Drag, or use the keyboard, to move them. */
export function Board({
	onShip,
	onOpen,
}: {
	/** Called when the owner drops a Card on Review; opens What shipped. */
	readonly onShip: (card: CardView) => void;
	readonly onOpen: (cardId: string) => void;
}) {
	const { startup, userId, isFounder } = useWorkspace();
	const { cards, create, move } = useBoard(startup._id);
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const newCardRef = useRef<HTMLInputElement>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, {
			// Enter opens a Card, so only Space lifts and drops it.
			keyboardCodes: {
				start: ["Space"],
				cancel: ["Escape"],
				end: ["Space"],
			},
		}),
	);

	useBoardKeys({
		rootRef,
		newCardRef,
		onOpen,
		isPaused: draggedId !== null,
	});

	const dragged = cards?.find((card) => card._id === draggedId) ?? null;

	function handleDragEnd(overId: string | undefined) {
		setDraggedId(null);
		if (!dragged || !overId || !COLUMN_IDS.has(overId)) return;

		const to = overId as Column;
		const viewer = { userId, isFounder };
		const action = dropAction(dragged, to, viewer);
		if (action === "ship") {
			onShip(dragged);
		} else if (action === "move" && (to === "todo" || to === "in_progress")) {
			void move(dragged._id, to);
		} else {
			const refusal = dropRefusal(dragged, to, viewer);
			if (refusal) toast(refusal);
		}
	}

	if (!cards) {
		return (
			<div className="flex gap-3 overflow-x-auto p-4 md:p-6">
				{COLUMNS.map((column) => (
					<Skeleton
						key={column.id}
						className="h-64 w-72 shrink-0 md:w-auto md:flex-1"
					/>
				))}
			</div>
		);
	}

	const hasOpenCards = cards.some((card) => card.status !== "done");

	return (
		<TooltipProvider>
			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetection}
				onDragStart={(event) => setDraggedId(String(event.active.id))}
				onDragEnd={(event) =>
					handleDragEnd(event.over ? String(event.over.id) : undefined)
				}
				onDragCancel={() => setDraggedId(null)}
			>
				<div
					ref={rootRef}
					className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4 md:p-6"
				>
					{COLUMNS.map((column) => (
						<BoardColumn
							key={column.id}
							id={column.id}
							label={column.label}
							cards={cards.filter((card) => card.status === column.id)}
							isDragging={draggedId !== null}
							onOpen={onOpen}
						>
							{column.id === "todo" ? (
								<NewCardInput
									inputRef={newCardRef}
									hasOpenCards={hasOpenCards}
									onCreate={create}
								/>
							) : null}
						</BoardColumn>
					))}
				</div>
				<DragOverlay>
					{dragged ? (
						<div className="rounded-lg border border-border bg-card p-3 shadow-lg">
							<CardFace card={dragged} />
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</TooltipProvider>
	);
}
