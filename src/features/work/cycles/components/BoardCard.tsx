import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import type { CycleTask } from "~/features/work/cycles/hooks/useCycleTasks";
import { ADD_PROOF_FIRST, canDrop } from "~/features/work/cycles/lib/kanban";
import {
	proofLinkLabel,
	TASK_STATUSES,
	type TaskStatus,
} from "~/features/work/tasks/constants";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";

type BoardCardProps = {
	readonly task: CycleTask;
	readonly isFounder: boolean;
	readonly isReadOnly: boolean;
	readonly isPending: boolean;
	/** Taking unassigned work: team Cycles only, since a lane is fixed. */
	readonly canTake: boolean;
	/** Shows whose it is: hackathon Review cards. */
	readonly showsOwner: boolean;
	readonly onMove: (to: TaskStatus) => void;
	readonly onTake: () => void;
	/** Opens the Task's details. */
	readonly onOpen: () => void;
};

/** A Task on a board: dragged by its grip or moved from its menu. */
export function BoardCard({
	task,
	isFounder,
	isReadOnly,
	isPending,
	canTake,
	showsOwner,
	onMove,
	onTake,
	onOpen,
}: BoardCardProps) {
	const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
		useDraggable({
			id: task._id,
			data: { status: task.status },
			disabled: isReadOnly || isPending,
		});
	const hasProof = task.proofLinks.length > 0;
	const isWorkable = task.status === "todo" || task.status === "in_progress";
	// Review is listed even without proof, disabled, so the rule is visible.
	const targets = TASK_STATUSES.filter(
		(status) =>
			status.value === task.status ||
			canDrop(task.status, status.value, isFounder, hasProof) ||
			(status.value === "review" && isWorkable && !hasProof),
	);
	const showsTake = canTake && !isReadOnly && !task.assignee && isWorkable;

	return (
		<li
			ref={setNodeRef}
			className={cn(
				"rounded-lg border bg-background p-3",
				isDragging && "opacity-40",
				isPending && "opacity-70",
			)}
		>
			<TaskSummary
				task={task}
				isFounder={isFounder}
				showsOwner={showsOwner}
				onOpen={onOpen}
				grip={
					isReadOnly ? null : (
						<button
							type="button"
							ref={setActivatorNodeRef}
							aria-label={`Drag ${task.title}`}
							className="-ml-1.5 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
							{...attributes}
							{...listeners}
						>
							<GripVertical className="size-4" />
						</button>
					)
				}
			/>
			{isReadOnly ? null : (
				<div className="mt-3 flex flex-wrap items-center gap-2">
					<Select
						value={task.status}
						disabled={isPending || targets.length === 1}
						onValueChange={(status) => onMove(status as TaskStatus)}
					>
						<SelectTrigger size="sm" aria-label={`Move ${task.title}`}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{targets.map((status) =>
								status.value === "review" && isWorkable ? (
									<SelectItem
										key={status.value}
										value={status.value}
										disabled={!hasProof}
									>
										{hasProof
											? "Send for review"
											: `Send for review · ${ADD_PROOF_FIRST}`}
									</SelectItem>
								) : (
									<SelectItem key={status.value} value={status.value}>
										{status.label}
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
					{showsTake ? (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={isPending}
							onClick={onTake}
						>
							Take
						</Button>
					) : null}
				</div>
			)}
		</li>
	);
}

/** "PR · github.com": a proof link's kind and where it points. */
export function proofChipLabel(link: CycleTask["proofLinks"][number]): string {
	let host = link.url;
	try {
		host = new URL(link.url).host.replace(/^www\./, "");
	} catch {
		// Stored links are validated URLs; fall back to the raw text regardless.
	}
	return `${proofLinkLabel(link.kind)} · ${host}`;
}

type TaskSummaryProps = {
	readonly task: CycleTask;
	readonly isFounder?: boolean;
	readonly showsOwner?: boolean;
	readonly grip?: React.ReactNode;
	/** Makes the title open the Task's details. */
	readonly onOpen?: () => void;
};

/** Title, owner, first proof link and review state; also the lifted card while dragging. */
export function TaskSummary({
	task,
	isFounder = false,
	showsOwner = false,
	grip,
	onOpen,
}: TaskSummaryProps) {
	const [firstProof, ...moreProof] = task.proofLinks;
	const ownerName =
		task.assignee?.name ?? task.assignee?.username ?? "Unassigned";
	const isChangesRequested =
		task.reviewNote !== null &&
		(task.status === "todo" || task.status === "in_progress");

	return (
		<div className="flex items-start gap-1">
			{grip}
			<div className="min-w-0 flex-1 space-y-1.5 pt-1">
				{onOpen ? (
					<button
						type="button"
						onClick={onOpen}
						className="block w-full text-left font-medium leading-snug break-words hover:underline focus-visible:underline focus-visible:outline-none"
					>
						{task.title}
					</button>
				) : (
					<p className="font-medium leading-snug break-words">{task.title}</p>
				)}
				{showsOwner ? (
					<div className="flex min-w-0 items-center gap-1.5 text-xs">
						<Avatar className="size-5 rounded-full">
							{task.assignee?.image ? (
								<AvatarImage src={task.assignee.image} alt="" />
							) : null}
							<AvatarFallback className="text-[10px]">
								{initials(task.assignee?.name ?? null, null)}
							</AvatarFallback>
						</Avatar>
						<span className="truncate">{ownerName}</span>
						{task.assigneeLeft ? <Badge variant="outline">Left</Badge> : null}
					</div>
				) : (
					<p className="text-xs text-muted-foreground">{ownerName}</p>
				)}
				{firstProof ? (
					<div className="flex min-w-0 flex-wrap items-center gap-1">
						<a
							href={firstProof.url}
							target="_blank"
							rel="noreferrer"
							className="max-w-full truncate rounded-md border px-1.5 py-0.5 text-xs hover:bg-muted"
						>
							{proofChipLabel(firstProof)}
						</a>
						{moreProof.length > 0 ? (
							<span className="text-xs text-muted-foreground">
								+{moreProof.length}
							</span>
						) : null}
					</div>
				) : null}
				{isChangesRequested ? (
					<Badge variant="destructive">Changes requested</Badge>
				) : null}
				{task.status === "review" && !isFounder ? (
					<p className="text-xs text-muted-foreground">Waiting for a Founder</p>
				) : null}
			</div>
		</div>
	);
}
