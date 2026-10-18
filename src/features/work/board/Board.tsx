import {
	type CollisionDetection,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	MouseSensor,
	pointerWithin,
	rectIntersection,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { refusalFor } from "../cardRules";
import { BoardColumn, type DropState } from "./BoardColumn";
import { useBoardScope } from "./BoardScope";
import { boardAnnouncements } from "./boardAnnouncements";
import { CardFace, TILE_CLASS } from "./CardTile";
import { COLUMNS, type Column, dropAction, dropRefusal } from "./dropRules";
import { NewCardInput } from "./NewCardInput";
import type { CardView } from "./types";
import { useBoard } from "./useBoard";
import { useBoardKeys } from "./useBoardKeys";

const COLUMN_IDS = new Set<string>(COLUMNS.map((column) => column.id));

/** The row of columns; on a phone it scrolls sideways a column at a time. */
const ROW_CLASS =
	"flex min-h-0 flex-1 snap-x snap-proximity gap-2 overflow-x-auto p-3 md:snap-none md:p-4";

/** Prefer the column under the pointer; keyboard drags fall back to overlap. */
const collisionDetection: CollisionDetection = (args) => {
	const underPointer = pointerWithin(args);
	return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

/** The four columns of Cards. Drag, or use the keyboard, to move them. */
export function Board({
	openCardId,
	onShip,
	onOpen,
	onClose,
}: {
	/** The Card open in the side panel, marked on the Board. */
	readonly openCardId: string | undefined;
	/** Called when the owner drops a Card on Review; opens What shipped. */
	readonly onShip: (card: CardView) => void;
	readonly onOpen: (cardId: string) => void;
	/** Closes the open Card (Esc). */
	readonly onClose: () => void;
}) {
	const scope = useBoardScope();
	const { cards, create, move, verify } = useBoard(scope);
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const newCardRef = useRef<HTMLTextAreaElement>(null);

	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
		// A short press-and-hold lifts a Card, so a swipe still scrolls the columns.
		useSensor(TouchSensor, {
			activationConstraint: { delay: 250, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, {
			// Enter opens a Card, so only Space lifts and drops it.
			keyboardCodes: {
				start: ["Space"],
				cancel: ["Escape"],
				end: ["Space"],
			},
		}),
	);

	const cardById = (cardId: string | null) =>
		cards?.find((card) => card._id === cardId);

	// Always the latest cards and verify, but one stable function for the key listener.
	const verifyLatest = useRef((_cardId: string) => {});
	verifyLatest.current = (cardId) => {
		const card = cardById(cardId);
		if (card && refusalFor(card, { kind: "verify" }, scope) === null) {
			void verify(card);
		}
	};
	const onVerify = useCallback(
		(cardId: string) => verifyLatest.current(cardId),
		[],
	);

	useBoardKeys({
		rootRef,
		newCardRef,
		openCardId,
		onOpen,
		onClose,
		onVerify,
		isPaused: draggedId !== null,
	});

	const dragged = cardById(draggedId) ?? null;

	/** Shown while dragging, so a refused column fades before the drop, not after. */
	function dropStateOf(column: Column): DropState {
		if (!dragged || dragged.status === column) return "idle";
		return dropAction(dragged, column, scope) ? "accept" : "refuse";
	}

	// One stable object, so dnd-kit doesn't resubscribe its monitor on every render; the
	// lookups run when an event fires, so they read the latest cards through the ref.
	const announceLatest = useRef({ cards, scope });
	announceLatest.current = { cards, scope };
	const accessibility = useMemo(() => {
		const cardOf = (cardId: string) =>
			announceLatest.current.cards?.find((card) => card._id === cardId);
		const announcements = boardAnnouncements(
			(cardId) => cardOf(cardId)?.title ?? "a Card",
			(columnId) =>
				COLUMNS.find((column) => column.id === columnId)?.label ?? columnId,
			(cardId, columnId) => {
				const card = cardOf(cardId);
				return card !== undefined && COLUMN_IDS.has(columnId)
					? dropAction(card, columnId as Column, announceLatest.current.scope)
					: null;
			},
		);
		return { announcements };
	}, []);

	function handleDragEnd(overId: string | undefined) {
		setDraggedId(null);
		if (!dragged || !overId || !COLUMN_IDS.has(overId)) return;
		const to = overId as Column;
		const action = dropAction(dragged, to, scope);
		if (action === "ship") {
			onShip(dragged);
		} else if (action === "move" && (to === "todo" || to === "in_progress")) {
			void move(dragged._id, to);
		} else {
			const refusal = dropRefusal(dragged, to, scope);
			if (refusal) toast(refusal);
		}
	}

	if (!cards) {
		return (
			<div className={ROW_CLASS}>
				{COLUMNS.map((column) => (
					<div
						key={column.id}
						className="flex w-72 shrink-0 flex-col gap-1.5 rounded-lg bg-muted/25 p-1.5 md:w-auto md:min-w-44 md:flex-1"
					>
						<Skeleton className="m-1.5 h-4 w-20" />
						<Skeleton className="h-16" />
						<Skeleton className="h-12" />
					</div>
				))}
			</div>
		);
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={collisionDetection}
			accessibility={accessibility}
			onDragStart={(event) => setDraggedId(String(event.active.id))}
			onDragEnd={(event) =>
				handleDragEnd(event.over ? String(event.over.id) : undefined)
			}
			onDragCancel={() => setDraggedId(null)}
		>
			<div ref={rootRef} className={ROW_CLASS}>
				{COLUMNS.map((column) => (
					<BoardColumn
						key={column.id}
						id={column.id}
						label={column.label}
						cards={cards.filter((card) => card.status === column.id)}
						dropState={dropStateOf(column.id)}
						openCardId={openCardId}
						onOpen={onOpen}
					>
						{column.id === "todo" && scope.kind === "startup" ? (
							<NewCardInput
								inputRef={newCardRef}
								note={
									cards.length === 0 ? "Three Cards is a good week." : undefined
								}
								onCreate={create}
							/>
						) : null}
					</BoardColumn>
				))}
			</div>
			<DragOverlay>
				{dragged ? (
					<div
						className={cn(
							TILE_CLASS,
							"cursor-grabbing border-input shadow-[0_8px_30px_rgb(0_0_0/0.5)]",
						)}
					>
						<CardFace card={dragged} />
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
