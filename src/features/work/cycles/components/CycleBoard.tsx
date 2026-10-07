import type { Id } from "@convex/_generated/dataModel";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragOverEvent,
	type DragStartEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
	BoardCard,
	TaskSummary,
} from "~/features/work/cycles/components/BoardCard";
import {
	BoardColumn,
	type DraggedTask,
} from "~/features/work/cycles/components/BoardColumn";
import { TaskDialog } from "~/features/work/cycles/components/TaskDialog";
import {
	type CycleTask,
	useCycleTasks,
} from "~/features/work/cycles/hooks/useCycleTasks";
import {
	type ReviewScope,
	useLaneTasks,
} from "~/features/work/cycles/hooks/useLaneTasks";
import { kanbanMove } from "~/features/work/cycles/lib/kanban";
import {
	TASK_STATUSES,
	type TaskStatus,
} from "~/features/work/tasks/constants";
import { cn } from "~/lib/utils";

/** A Participant's lane a Founder can pick. */
export type LaneOption = {
	userId: Id<"users">;
	name: string;
	/** Left or withdrew: their lane stays readable to Founders. */
	hasLeft: boolean;
};

/**
 * Which board this is. A team Cycle shows every Task; a hackathon shows one
 * lane, and a Founder picks it and sees Review across lanes.
 */
export type BoardLane =
	| { mode: "team" }
	| {
			mode: "hackathon";
			/** The lane shown: a Participant's own, or the Founder's pick. */
			assigneeUserId: Id<"users"> | null;
			canPickLane: boolean;
			lanes: LaneOption[];
			onLaneChange: (userId: Id<"users">) => void;
			scope: ReviewScope;
			onScopeChange: (scope: ReviewScope) => void;
			/** Before the start a lane is empty: Starter Tasks arrive then. */
			hasStarted: boolean;
	  };

type CycleBoardProps = {
	readonly startupId: Id<"startups">;
	readonly cycleId: Id<"cycles">;
	readonly isFounder: boolean;
	/** A closed Cycle, or a hackathon that isn't running, is read-only. */
	readonly isReadOnly: boolean;
	readonly lane: BoardLane;
};

/**
 * The kanban for a team Cycle or a hackathon. Cards drag by mouse, by touch
 * (press and hold the grip) or by keyboard, and each card's menu offers the
 * same moves.
 */
export function CycleBoard(props: CycleBoardProps) {
	return props.lane.mode === "team" ? (
		<TeamBoard {...props} />
	) : (
		<HackathonBoard {...props} lane={props.lane} />
	);
}

function TeamBoard({
	startupId,
	cycleId,
	isFounder,
	isReadOnly,
}: CycleBoardProps) {
	const board = useCycleTasks(cycleId, isFounder);
	return (
		<Board
			board={board}
			startupId={startupId}
			isFounder={isFounder}
			isReadOnly={isReadOnly}
			isHackathon={false}
			canAdd={!isReadOnly}
			columns={TASK_STATUSES}
		/>
	);
}

function HackathonBoard({
	startupId,
	cycleId,
	isFounder,
	isReadOnly,
	lane,
}: CycleBoardProps & { lane: Extract<BoardLane, { mode: "hackathon" }> }) {
	const board = useLaneTasks({
		cycleId,
		assigneeUserId: lane.assigneeUserId,
		isFounder,
		scope: lane.scope,
	});
	// A lane with nothing to work on yet: Review alone doesn't count.
	const isLaneEmpty =
		!isFounder &&
		(board.tasks?.every((task) => task.status === "review") ?? false);
	const laneEmpty = lane.hasStarted
		? "Add your first Task"
		: "Starter Tasks appear here when the hackathon starts";
	// A Founder judges first, so their board leads with Review.
	const columns = isFounder
		? [
				...TASK_STATUSES.filter((column) => column.value === "review"),
				...TASK_STATUSES.filter((column) => column.value !== "review"),
			]
		: TASK_STATUSES;

	if (isFounder && lane.lanes.length === 0) {
		return (
			<EmptyState
				title="Nobody joined this hackathon"
				description="Accepted Participants each get a lane here once it starts."
			/>
		);
	}

	return (
		<div className="space-y-4">
			{isFounder ? (
				<LanePicker lane={lane} countByLane={board.countByLane} />
			) : null}
			<Board
				board={board}
				startupId={startupId}
				isFounder={isFounder}
				isReadOnly={isReadOnly}
				isHackathon
				canAdd={!isReadOnly && !isFounder}
				columns={columns}
				emptyFor={(status) =>
					status === "review" && isFounder
						? "Nothing to review"
						: status === "todo" && isLaneEmpty
							? laneEmpty
							: undefined
				}
				noteFor={(status) =>
					status === "review" && board.isReviewTruncated
						? "Showing the oldest 200"
						: undefined
				}
			/>
		</div>
	);
}

type LanePickerProps = {
	readonly lane: Extract<BoardLane, { mode: "hackathon" }>;
	readonly countByLane: Map<Id<"users">, number>;
};

/** The Founder's lane select ("Name · N in review") and Review scope. */
function LanePicker({ lane, countByLane }: LanePickerProps) {
	const options = [...lane.lanes].sort(
		(a, b) =>
			(countByLane.get(b.userId) ?? 0) - (countByLane.get(a.userId) ?? 0),
	);
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div className="min-w-0 space-y-2 sm:w-72">
				<Label htmlFor="lane-picker">Lane</Label>
				<Select
					value={lane.assigneeUserId ?? undefined}
					onValueChange={(userId) => lane.onLaneChange(userId as Id<"users">)}
					disabled={!lane.canPickLane}
				>
					<SelectTrigger id="lane-picker" className="h-11 w-full">
						<SelectValue placeholder="Pick a Participant" />
					</SelectTrigger>
					<SelectContent>
						{options.map((option) => (
							<SelectItem key={option.userId} value={option.userId}>
								{option.name} · {countByLane.get(option.userId) ?? 0} in review
								{option.hasLeft ? " · Left" : ""}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<fieldset className="inline-flex self-start rounded-lg border p-0.5 sm:self-auto">
				<legend className="sr-only">Review shows</legend>
				{(
					[
						{ value: "all", label: "All lanes" },
						{ value: "lane", label: "This lane" },
					] as const
				).map((option) => (
					<label
						key={option.value}
						className={cn(
							"flex h-9 cursor-pointer items-center rounded-md px-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
							lane.scope === option.value
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<input
							type="radio"
							name="review-scope"
							value={option.value}
							checked={lane.scope === option.value}
							onChange={() => lane.onScopeChange(option.value)}
							className="sr-only"
						/>
						{option.label}
					</label>
				))}
			</fieldset>
		</div>
	);
}

type BoardData = ReturnType<typeof useCycleTasks>;

type BoardProps = {
	readonly board: BoardData;
	readonly startupId: Id<"startups">;
	readonly isFounder: boolean;
	readonly isReadOnly: boolean;
	readonly isHackathon: boolean;
	readonly canAdd: boolean;
	readonly columns: readonly { value: TaskStatus; label: string }[];
	readonly emptyFor?: (status: TaskStatus) => string | undefined;
	readonly noteFor?: (status: TaskStatus) => string | undefined;
};

function Board({
	board,
	startupId,
	isFounder,
	isReadOnly,
	isHackathon,
	canAdd,
	columns,
	emptyFor,
	noteFor,
}: BoardProps) {
	const { tasks, pendingId } = board;
	const [title, setTitle] = useState("");
	const [active, setActive] = useState<CycleTask | null>(null);
	const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
	const [returning, setReturning] = useState<CycleTask | null>(null);
	const [note, setNote] = useState("");
	const [openId, setOpenId] = useState<Id<"tasks"> | null>(null);
	const opened = tasks?.find((task) => task._id === openId) ?? null;
	const dragged: DraggedTask | null = active
		? { status: active.status, hasProof: active.proofLinks.length > 0 }
		: null;
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 200, tolerance: 8 },
		}),
		useSensor(KeyboardSensor),
	);

	const overMove =
		active && overStatus
			? kanbanMove(
					active.status,
					overStatus,
					isFounder,
					active.proofLinks.length > 0,
				)
			: null;
	const dropRefusal = overMove?.kind === "refused" ? overMove.reason : null;

	/** On a hackathon a Founder only reviews: every other card is theirs to read. */
	function isCardReadOnly(task: CycleTask): boolean {
		return isReadOnly || (isHackathon && isFounder && task.status !== "review");
	}

	function move(task: CycleTask, to: TaskStatus) {
		if (board.move(task, to) === "needs_note") {
			setNote("");
			setReturning(task);
		}
	}

	function onDragStart(event: DragStartEvent) {
		setActive(tasks?.find((task) => task._id === event.active.id) ?? null);
	}

	function onDragOver(event: DragOverEvent) {
		setOverStatus((event.over?.id as TaskStatus | undefined) ?? null);
	}

	function onDragEnd(event: DragEndEvent) {
		const task = active;
		setActive(null);
		setOverStatus(null);
		if (task && event.over) {
			move(task, event.over.id as TaskStatus);
		}
	}

	async function create() {
		if (title.trim() && (await board.create(startupId, title.trim()))) {
			setTitle("");
		}
	}

	async function sendBack() {
		if (returning && (await board.returnWithNote(returning._id, note))) {
			setReturning(null);
		}
	}

	return (
		<section className="space-y-4">
			{canAdd ? (
				<form
					className="flex flex-col gap-2 sm:flex-row"
					onSubmit={(event) => {
						event.preventDefault();
						void create();
					}}
				>
					<Input
						aria-label="Task title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder={
							isHackathon
								? "Add a Task to your lane"
								: "Add a Task to this Cycle"
						}
						className="h-11 flex-1"
					/>
					<Button
						type="submit"
						disabled={!title.trim() || pendingId === "new"}
						className="h-11"
					>
						Add Task
					</Button>
				</form>
			) : null}

			{tasks === undefined ? (
				<p className="text-sm text-muted-foreground">Loading Tasks…</p>
			) : (
				<DndContext
					sensors={sensors}
					onDragStart={onDragStart}
					onDragOver={onDragOver}
					onDragEnd={onDragEnd}
					onDragCancel={() => {
						setActive(null);
						setOverStatus(null);
					}}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
						{columns.map((column) => {
							const items = tasks.filter(
								(task) => task.status === column.value,
							);
							return (
								<BoardColumn
									key={column.value}
									status={column.value}
									label={column.label}
									count={items.length}
									dragged={dragged}
									isFounder={isFounder}
									empty={emptyFor?.(column.value)}
									note={noteFor?.(column.value)}
								>
									{items.map((task) => (
										<BoardCard
											key={task._id}
											task={task}
											isFounder={isFounder}
											isReadOnly={isCardReadOnly(task)}
											isPending={pendingId === task._id}
											canTake={!isHackathon}
											showsOwner={isHackathon && task.status === "review"}
											onMove={(to) => move(task, to)}
											onTake={() => void board.take(task._id)}
											onOpen={() => setOpenId(task._id)}
										/>
									))}
								</BoardColumn>
							);
						})}
					</div>
					<DragOverlay>
						{active ? (
							<div className="cursor-grabbing rounded-lg border bg-background p-3 shadow-lg">
								<TaskSummary
									task={active}
									isFounder={isFounder}
									showsOwner={isHackathon && active.status === "review"}
								/>
								{/* The card hides the column's header, so it carries the rule too. */}
								{dropRefusal ? (
									<p className="mt-2 text-xs font-medium text-destructive">
										{dropRefusal}
									</p>
								) : null}
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			)}

			<TaskDialog
				task={opened}
				isFounder={isFounder}
				isReadOnly={opened ? isCardReadOnly(opened) : true}
				isPending={opened !== null && pendingId === opened._id}
				canTake={!isHackathon}
				onClose={() => setOpenId(null)}
				onEdit={(title, description) =>
					opened
						? board.edit(opened._id, title, description)
						: Promise.resolve(false)
				}
				onDelete={() =>
					opened ? board.remove(opened._id) : Promise.resolve(false)
				}
				onTake={() => opened && void board.take(opened._id)}
				onAddProofLink={(url) =>
					opened ? board.addProofLink(opened._id, url) : Promise.resolve(false)
				}
				onRemoveProofLink={(url) =>
					opened && void board.removeProofLink(opened._id, url)
				}
				onVerify={() => opened && void board.verify(opened._id)}
				onSendBack={() => {
					if (opened) {
						setOpenId(null);
						setNote("");
						setReturning(opened);
					}
				}}
			/>

			<Dialog
				open={returning !== null}
				onOpenChange={(open) => {
					if (!open) {
						setReturning(null);
					}
				}}
			>
				<DialogContent>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void sendBack();
						}}
					>
						<DialogHeader>
							<DialogTitle>Send back “{returning?.title}”</DialogTitle>
							<DialogDescription>
								It returns to In progress with your note.
							</DialogDescription>
						</DialogHeader>
						<Textarea
							aria-label="What needs to change?"
							placeholder="What needs to change?"
							value={note}
							onChange={(event) => setNote(event.target.value)}
							autoFocus
						/>
						<DialogFooter>
							<Button
								type="submit"
								disabled={!note.trim() || pendingId !== null}
							>
								Send back
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</section>
	);
}
