import { canDrop } from "~/features/cycles/lib/kanban";
import type { PulseStatus } from "~/features/pulses/constants";
import { cn } from "~/lib/utils";

type KanbanColumnProps = {
	readonly status: PulseStatus;
	readonly label: string;
	readonly count: number;
	/** Status of the Pulse being dragged, if any. */
	readonly dragged: PulseStatus | null;
	readonly isOver: boolean;
	readonly isFounder: boolean;
	readonly dropZone: Record<string, string>;
	readonly children: React.ReactNode;
};

export function KanbanColumn({
	status,
	label,
	count,
	dragged,
	isOver,
	isFounder,
	dropZone,
	children,
}: KanbanColumnProps) {
	const isOrigin = dragged === status;
	const isAllowed = dragged !== null && canDrop(dragged, status, isFounder);
	const isRefused = dragged !== null && !isOrigin && !isAllowed;

	return (
		<div
			{...dropZone}
			className={cn(
				"rounded-xl border border-border bg-card/40 p-3 transition-colors",
				isRefused && "opacity-50",
				isOver && isAllowed && "border-primary bg-primary/5",
				isOver && isRefused && "border-destructive",
			)}
		>
			<div className="mb-3 flex items-center justify-between gap-2">
				<h2 className="text-sm font-medium">{label}</h2>
				<span className="text-xs tabular-nums text-muted-foreground">
					{count}
				</span>
			</div>
			<ul className="min-h-12 space-y-2">{children}</ul>
		</div>
	);
}
