import { useDroppable } from "@dnd-kit/core";
import {
	ADD_PROOF_FIRST,
	canDrop,
	kanbanMove,
} from "~/features/work/cycles/lib/kanban";
import type { TaskStatus } from "~/features/work/tasks/constants";
import { cn } from "~/lib/utils";

/** The Task being dragged: where it comes from, and whether it carries proof. */
export type DraggedTask = { status: TaskStatus; hasProof: boolean };

type BoardColumnProps = {
	readonly status: TaskStatus;
	readonly label: string;
	readonly count: number;
	readonly dragged: DraggedTask | null;
	readonly isFounder: boolean;
	/** Shown when the column holds no cards. */
	readonly empty?: string;
	/** A line under the heading, e.g. that the column is cut short. */
	readonly note?: string;
	readonly children: React.ReactNode;
};

/** A drop zone that shows, while dragging, whether it will take the card. */
export function BoardColumn({
	status,
	label,
	count,
	dragged,
	isFounder,
	empty,
	note,
	children,
}: BoardColumnProps) {
	const { setNodeRef, isOver } = useDroppable({ id: status });
	const isOrigin = dragged?.status === status;
	const isAllowed =
		dragged !== null &&
		canDrop(dragged.status, status, isFounder, dragged.hasProof);
	const isRefused = dragged !== null && !isOrigin && !isAllowed;
	const refusal =
		isOver && isRefused && dragged
			? kanbanMove(dragged.status, status, isFounder, dragged.hasProof)
			: null;
	const refusedText =
		refusal?.kind === "refused" && refusal.reason === ADD_PROOF_FIRST
			? ADD_PROOF_FIRST
			: "Can't move here";

	return (
		<section
			ref={setNodeRef}
			aria-label={label}
			data-refused={isOver && isRefused ? "true" : undefined}
			className={cn(
				"min-w-0 rounded-xl border bg-card/40 p-3 transition-colors",
				isRefused && !isOver && "opacity-50",
				isOver && isAllowed && "border-primary bg-primary/5",
				isOver && isRefused && "border-destructive bg-destructive/10",
			)}
		>
			<div className="mb-3 flex items-center justify-between gap-2">
				<h2 className="text-sm font-medium">{label}</h2>
				<span
					aria-live="polite"
					className={cn(
						"text-xs",
						isOver && isRefused
							? "font-medium text-destructive"
							: "tabular-nums text-muted-foreground",
					)}
				>
					{isOver && isRefused ? refusedText : count}
				</span>
			</div>
			{note ? (
				<p className="mb-2 text-xs text-muted-foreground">{note}</p>
			) : null}
			<ul className="min-h-12 space-y-2">
				{count === 0 && empty ? (
					<li className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
						{empty}
					</li>
				) : null}
				{children}
			</ul>
		</section>
	);
}
