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
import {
	CardFace,
	COLUMNS,
	type Column,
	dropAction,
	dropRefusal,
	NewCardInput,
	refusalFor,
	TILE_CLASS,
	useBoardCards,
	useBoardScope,
} from "~/entities/card";
import { useTeamPeople } from "~/entities/contributor";
import { useCreateCard } from "~/features/create-card";
import { useMoveCard } from "~/features/move-card";
import { useVerifyCard } from "~/features/review-card";
import { cn } from "~/shared/lib/cn";
import { Skeleton } from "~/shared/ui/skeleton";
import { useBoardKeys } from "../lib/useBoardKeys";
import { boardAnnouncements } from "../model/boardAnnouncements";
import {
	groupIntoLanes,
	type Lane,
	laneDropId,
	parseLaneDropId,
	resolveDrop,
} from "../model/lanes";
import { BoardColumn, type DropState } from "./BoardColumn";
import { useCardBoard } from "./CardBoard";

/** The row of columns; on a phone it scrolls sideways a column at a time. */
const ROW_CLASS =
	"flex min-h-0 flex-1 snap-x snap-proximity gap-2 overflow-x-auto p-3 md:snap-none md:p-4";

/** Prefer the column under the pointer; keyboard drags fall back to overlap. */
const collisionDetection: CollisionDetection = (args) => {
	const underPointer = pointerWithin(args);
	return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

/** The four columns of Cards. Drag, or use the keyboard, to move them. */
export function Board() {
	const { openCardId, open: onOpen, close: onClose, ship } = useCardBoard();
	const scope = useBoardScope();
	const cards = useBoardCards(scope);
	const team = useTeamPeople(
		scope.kind === "startup" ? scope.startupId : undefined,
	);
	const lanes = cards && team ? groupIntoLanes(cards, team) : null;
	const create = useCreateCard(scope);
	const move = useMoveCard(scope);
	const verify = useVerifyCard(scope);
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
	function dropStateOf(column: Column, laneId?: string): DropState {
		if (!dragged) return "idle";
		const target = resolveDrop(
			laneId === undefined ? column : laneDropId(laneId, column),
			dragged,
			lanes,
		);
		if (target?.otherLane) return "refuse";
		if (dragged.status === column) return "idle";
		return dropAction(dragged, column, scope) ? "accept" : "refuse";
	}

	// One stable object, so dnd-kit doesn't resubscribe its monitor on every render; the
	// lookups run when an event fires, so they read the latest cards through the ref.
	const announceLatest = useRef({ cards, scope, lanes });
	announceLatest.current = { cards, scope, lanes };
	const accessibility = useMemo(() => {
		const cardOf = (cardId: string) =>
			announceLatest.current.cards?.find((card) => card._id === cardId);
		const announcements = boardAnnouncements(
			(cardId) => cardOf(cardId)?.title ?? "a Card",
			(dropId) => {
				const inLane = parseLaneDropId(dropId);
				const column = inLane?.column ?? dropId;
				const label =
					COLUMNS.find((each) => each.id === column)?.label ?? column;
				const lane = announceLatest.current.lanes?.find(
					(each) => each.id === inLane?.laneId,
				);
				return lane ? `${lane.name} · ${label}` : label;
			},
			(cardId, dropId) => {
				const card = cardOf(cardId);
				const target = card
					? resolveDrop(dropId, card, announceLatest.current.lanes)
					: null;
				return card && target && !target.otherLane
					? dropAction(card, target.column, announceLatest.current.scope)
					: null;
			},
		);
		return { announcements };
	}, []);

	function handleDragEnd(overId: string | undefined) {
		setDraggedId(null);
		if (!dragged || !overId) return;
		const target = resolveDrop(overId, dragged, lanes);
		if (!target) return;
		if (target.otherLane) {
			toast("Change the owner from the Card");
			return;
		}
		const to = target.column;
		const action = dropAction(dragged, to, scope);
		if (action === "ship") {
			ship(dragged);
		} else if (action === "move" && (to === "todo" || to === "in_progress")) {
			void move(dragged._id, to);
		} else {
			const refusal = dropRefusal(dragged, to, scope);
			if (refusal) toast(refusal);
		}
	}

	if (!cards || (scope.kind === "startup" && !lanes)) {
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
			{lanes ? (
				<div
					ref={rootRef}
					className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 md:p-4"
				>
					{lanes.map((lane) => (
						<LaneRow
							key={lane.id}
							lane={lane}
							dropStateOf={dropStateOf}
							openCardId={openCardId}
							onOpen={onOpen}
							newCard={
								lane.ownerId !== null &&
								(lane.ownerId === scope.userId || scope.role === "founder")
									? {
											inputRef:
												lane.ownerId === scope.userId ? newCardRef : undefined,
											note:
												lane.ownerId === scope.userId && lane.cards.length === 0
													? "Three to five Cards is a good week."
													: undefined,
											onCreate: (title: string) =>
												create(title, lane.ownerId ?? undefined),
										}
									: null
							}
						/>
					))}
				</div>
			) : (
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
						/>
					))}
				</div>
			)}
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

/** One person's row: their name and role, then the four columns of their Cards. */
function LaneRow({
	lane,
	dropStateOf,
	openCardId,
	onOpen,
	newCard,
}: {
	readonly lane: Lane;
	readonly dropStateOf: (column: Column, laneId: string) => DropState;
	readonly openCardId: string | undefined;
	readonly onOpen: (cardId: string) => void;
	/** The new-Card input in this lane's To do; `null` where this viewer can't add. */
	readonly newCard: {
		readonly inputRef: React.Ref<HTMLTextAreaElement> | undefined;
		readonly note: string | undefined;
		readonly onCreate: (title: string) => Promise<boolean>;
	} | null;
}) {
	return (
		<section aria-label={lane.name} className="flex shrink-0 flex-col gap-1.5">
			<h3 className="flex items-baseline gap-2 px-1 text-sm font-medium">
				{lane.name}
				{lane.role ? (
					<span className="text-xs font-normal text-muted-foreground">
						{lane.role}
					</span>
				) : null}
			</h3>
			<div className="flex snap-x snap-proximity gap-2 overflow-x-auto md:snap-none">
				{COLUMNS.map((column) => (
					<BoardColumn
						key={column.id}
						id={column.id}
						dropId={laneDropId(lane.id, column.id)}
						label={column.label}
						ariaLabel={`${lane.name} · ${column.label}`}
						cards={lane.cards.filter((card) => card.status === column.id)}
						dropState={dropStateOf(column.id, lane.id)}
						openCardId={openCardId}
						onOpen={onOpen}
					>
						{column.id === "todo" && newCard ? (
							<NewCardInput
								inputRef={newCard.inputRef}
								note={newCard.note}
								onCreate={newCard.onCreate}
								shortcut={newCard.inputRef ? "C" : null}
							/>
						) : null}
					</BoardColumn>
				))}
			</div>
		</section>
	);
}
