import type { Id } from "@convex/_generated/dataModel";
import { GripVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import { canDrop } from "~/features/work/cycles/lib/kanban";
import { PulseProofLinks } from "~/features/work/pulses/components/PulseProofLinks";
import {
	type ProofLinkKind,
	PULSE_STATUSES,
	type PulseStatus,
} from "~/features/work/pulses/constants";
import { cn } from "~/lib/utils";

export type KanbanPulse = {
	_id: Id<"pulses">;
	title: string;
	status: PulseStatus;
	reviewNote: string | null;
	proofLinks: { kind: ProofLinkKind; url: string }[];
	assignee: { name: string | null; username: string | null } | null;
};

type PulseCardProps = {
	readonly pulse: KanbanPulse;
	readonly isFounder: boolean;
	readonly isPending: boolean;
	readonly isDragging: boolean;
	readonly offset: { dx: number; dy: number } | null;
	readonly dragHandle: React.HTMLAttributes<HTMLElement>;
	readonly onMove: (to: PulseStatus) => void;
	readonly onTake: () => void;
	readonly run: (action: () => Promise<unknown>) => void;
};

export function PulseCard({
	pulse,
	isFounder,
	isPending,
	isDragging,
	offset,
	dragHandle,
	onMove,
	onTake,
	run,
}: PulseCardProps) {
	const targets = PULSE_STATUSES.filter(
		(status) =>
			status.value === pulse.status ||
			canDrop(pulse.status, status.value, isFounder),
	);
	const isEditable = pulse.status === "todo" || pulse.status === "in_progress";

	return (
		<li
			className={cn(
				"rounded-lg border border-border bg-background p-3",
				isDragging && "relative z-10 shadow-lg",
			)}
			style={
				offset
					? { transform: `translate(${offset.dx}px, ${offset.dy}px)` }
					: undefined
			}
		>
			<div className="flex items-start gap-2">
				<button
					type="button"
					aria-label={`Drag ${pulse.title}`}
					className="-ml-1 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:text-foreground"
					{...dragHandle}
				>
					<GripVertical className="size-4" />
				</button>
				<div className="min-w-0 flex-1">
					<p className="font-medium leading-snug">{pulse.title}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{pulse.assignee?.name ?? pulse.assignee?.username ?? "Unassigned"}
					</p>
					{pulse.reviewNote && pulse.status === "in_progress" ? (
						<p className="mt-1 text-xs text-destructive">
							Sent back: {pulse.reviewNote}
						</p>
					) : null}
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center gap-1">
				<PulseProofLinks
					pulseId={pulse._id}
					proofLinks={pulse.proofLinks}
					canEdit={isEditable}
					isPending={isPending}
					run={run}
				/>
			</div>
			<div className="mt-2 flex items-center justify-between gap-2">
				<select
					aria-label="Move Pulse"
					value={pulse.status}
					disabled={isPending || targets.length === 1}
					onChange={(event) => onMove(event.target.value as PulseStatus)}
					className="border-input h-7 rounded-md border bg-transparent px-1 text-xs"
				>
					{targets.map((status) => (
						<option key={status.value} value={status.value}>
							{status.label}
						</option>
					))}
				</select>
				{!pulse.assignee && isEditable ? (
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="h-7 px-2 text-xs"
						disabled={isPending}
						onClick={onTake}
					>
						Take
					</Button>
				) : null}
			</div>
		</li>
	);
}
