import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import type { CyclePulse } from "~/features/work/cycles/hooks/useCyclePulses";
import { canDrop } from "~/features/work/cycles/lib/kanban";
import {
	PULSE_STATUSES,
	type PulseStatus,
} from "~/features/work/pulses/constants";
import { cn } from "~/lib/utils";

type BoardCardProps = {
	readonly pulse: CyclePulse;
	readonly isFounder: boolean;
	readonly isReadOnly: boolean;
	readonly isPending: boolean;
	readonly onMove: (to: PulseStatus) => void;
	readonly onTake: () => void;
	/** Opens the Pulse's details. */
	readonly onOpen: () => void;
};

/** A Pulse on the Cycle board: dragged by its grip or moved from its menu. */
export function BoardCard({
	pulse,
	isFounder,
	isReadOnly,
	isPending,
	onMove,
	onTake,
	onOpen,
}: BoardCardProps) {
	const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
		useDraggable({
			id: pulse._id,
			data: { status: pulse.status },
			disabled: isReadOnly || isPending,
		});
	const targets = PULSE_STATUSES.filter(
		(status) =>
			status.value === pulse.status ||
			canDrop(pulse.status, status.value, isFounder),
	);
	const canTake =
		!isReadOnly &&
		!pulse.assignee &&
		(pulse.status === "todo" || pulse.status === "in_progress");

	return (
		<li
			ref={setNodeRef}
			className={cn(
				"rounded-lg border bg-background p-3",
				isDragging && "opacity-40",
				isPending && "opacity-70",
			)}
		>
			<PulseSummary
				pulse={pulse}
				onOpen={onOpen}
				grip={
					isReadOnly ? null : (
						<button
							type="button"
							ref={setActivatorNodeRef}
							aria-label={`Drag ${pulse.title}`}
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
						value={pulse.status}
						disabled={isPending || targets.length === 1}
						onValueChange={(status) => onMove(status as PulseStatus)}
					>
						<SelectTrigger size="sm" aria-label={`Move ${pulse.title}`}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{targets.map((status) => (
								<SelectItem key={status.value} value={status.value}>
									{status.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{canTake ? (
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

type PulseSummaryProps = {
	readonly pulse: CyclePulse;
	readonly grip?: React.ReactNode;
	/** Makes the title open the Pulse's details. */
	readonly onOpen?: () => void;
};

/** Title, assignee, proof and return note; also the lifted card while dragging. */
export function PulseSummary({ pulse, grip, onOpen }: PulseSummaryProps) {
	const proofCount = pulse.proofLinks.length;
	return (
		<div className="flex items-start gap-1">
			{grip}
			<div className="min-w-0 flex-1 pt-1">
				{onOpen ? (
					<button
						type="button"
						onClick={onOpen}
						className="block w-full text-left font-medium leading-snug break-words hover:underline focus-visible:underline focus-visible:outline-none"
					>
						{pulse.title}
					</button>
				) : (
					<p className="font-medium leading-snug break-words">{pulse.title}</p>
				)}
				<p className="mt-1 text-xs text-muted-foreground">
					{pulse.assignee?.name ?? pulse.assignee?.username ?? "Unassigned"}
					{proofCount > 0
						? ` · ${proofCount} proof ${proofCount === 1 ? "link" : "links"}`
						: null}
				</p>
				{pulse.reviewNote && pulse.status === "in_progress" ? (
					<p className="mt-1 text-xs break-words text-destructive">
						Sent back: {pulse.reviewNote}
					</p>
				) : null}
			</div>
		</div>
	);
}
