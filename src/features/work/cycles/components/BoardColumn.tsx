import { useDroppable } from "@dnd-kit/core";
import { canDrop } from "~/features/work/cycles/lib/kanban";
import type { PulseStatus } from "~/features/work/pulses/constants";
import { cn } from "~/lib/utils";

type BoardColumnProps = {
	readonly status: PulseStatus;
	readonly label: string;
	readonly count: number;
	/** Status of the Pulse being dragged, if any. */
	readonly dragged: PulseStatus | null;
	readonly isFounder: boolean;
	readonly children: React.ReactNode;
};

/** A drop zone that shows, while dragging, whether it will take the card. */
export function BoardColumn({
	status,
	label,
	count,
	dragged,
	isFounder,
	children,
}: BoardColumnProps) {
	const { setNodeRef, isOver } = useDroppable({ id: status });
	const isOrigin = dragged === status;
	const isAllowed = dragged !== null && canDrop(dragged, status, isFounder);
	const isRefused = dragged !== null && !isOrigin && !isAllowed;

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
				{isOver && isRefused ? (
					<span className="text-xs font-medium text-destructive">
						Can't move here
					</span>
				) : (
					<span className="text-xs tabular-nums text-muted-foreground">
						{count}
					</span>
				)}
			</div>
			<ul className="min-h-12 space-y-2">{children}</ul>
		</section>
	);
}
