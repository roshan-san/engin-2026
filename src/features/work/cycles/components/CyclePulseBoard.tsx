import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { KanbanColumn } from "~/features/work/cycles/components/KanbanColumn";
import { PulseCard } from "~/features/work/cycles/components/PulseCard";
import { useCyclePulses } from "~/features/work/cycles/hooks/useCyclePulses";
import { usePointerDrag } from "~/features/work/cycles/hooks/usePointerDrag";
import {
	PULSE_STATUSES,
	type PulseStatus,
} from "~/features/work/pulses/constants";
import { toErrorMessage } from "~/lib/validation";

type CyclePulseBoardProps = {
	readonly startupId: Id<"startups">;
	readonly cycleId: Id<"cycles">;
	readonly canCreate: boolean;
	readonly isFounder: boolean;
};

type DraggedPulse = { _id: Id<"pulses">; status: PulseStatus };

export function CyclePulseBoard({
	startupId,
	cycleId,
	canCreate,
	isFounder,
}: CyclePulseBoardProps) {
	const { pulses, pendingId, run, move } = useCyclePulses(cycleId, isFounder);
	const createPulse = useMutation(api.work.pulses.create);
	const assignToMe = useMutation(api.work.pulses.assignToMe);
	const [title, setTitle] = useState("");
	const { drag, handlers, dropZoneProps } = usePointerDrag<DraggedPulse>(
		(pulse, zone) => move(pulse._id, pulse.status, zone as PulseStatus),
	);

	async function create() {
		if (!title.trim()) {
			return;
		}
		try {
			await createPulse({ startupId, title: title.trim(), cycleId });
			setTitle("");
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not create Pulse"));
		}
	}

	return (
		<section className="space-y-4">
			{canCreate ? (
				<form
					className="flex flex-col gap-2 sm:flex-row"
					onSubmit={(event) => {
						event.preventDefault();
						void create();
					}}
				>
					<Input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Add a Pulse to this Cycle"
						className="h-11 flex-1"
					/>
					<Button type="submit" disabled={!title.trim()} className="h-11">
						Add Pulse
					</Button>
				</form>
			) : null}

			{pulses === undefined ? (
				<p className="text-sm text-muted-foreground">Loading Pulses…</p>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
					{PULSE_STATUSES.map((column) => {
						const items = pulses.filter(
							(pulse) => pulse.status === column.value,
						);
						return (
							<KanbanColumn
								key={column.value}
								status={column.value}
								label={column.label}
								count={items.length}
								dragged={drag?.item.status ?? null}
								isOver={drag?.over === column.value}
								isFounder={isFounder}
								dropZone={dropZoneProps(column.value)}
							>
								{items.map((pulse) => {
									const isDragging = drag?.item._id === pulse._id;
									return (
										<PulseCard
											key={pulse._id}
											pulse={pulse}
											isFounder={isFounder}
											isPending={pendingId === pulse._id}
											isDragging={isDragging}
											offset={isDragging ? drag : null}
											dragHandle={handlers({
												_id: pulse._id,
												status: pulse.status,
											})}
											onMove={(to) => move(pulse._id, pulse.status, to)}
											onTake={() =>
												void run(pulse._id, () =>
													assignToMe({ pulseId: pulse._id }),
												)
											}
											run={(action) => void run(pulse._id, action)}
										/>
									);
								})}
							</KanbanColumn>
						);
					})}
				</div>
			)}
		</section>
	);
}
