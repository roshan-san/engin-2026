import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { BuildFrame } from "~/features/app/layout/BuildFrame";
import { ActivityDashboard } from "~/features/teams/startup/workspace/components/ActivityDashboard";
import { CyclePulseBoard } from "~/features/work/cycles/components/CyclePulseBoard";
import { StartCycleForm } from "~/features/work/cycles/components/StartCycleForm";
import { cycleUrgency } from "~/features/work/cycles/constants";
import { useActiveCycle } from "~/features/work/cycles/hooks/useActiveCycle";
import { daysRemaining, formatDateRange } from "~/lib/dates";
import { cn } from "~/lib/utils";

export function CyclePage() {
	return (
		<BuildFrame>
			<CycleView />
		</BuildFrame>
	);
}

function CycleView() {
	const { startup, isFounder, cycles, cycle, selectCycle, isLoading } =
		useActiveCycle();
	const startCycle = useMutation(api.work.cycles.start);
	const closeCycle = useMutation(api.work.cycles.close);
	const [carryOverTo, setCarryOverTo] = useState("");

	if (isLoading) {
		return <PageLoading rows={4} />;
	}

	if (!startup) {
		return null;
	}

	const remaining = cycle ? daysRemaining(cycle.endAt) : 0;
	const urgency = cycle ? cycleUrgency(cycle.endAt, cycle.status) : null;
	const carryOverTargets = cycles.filter(
		(item) => item._id !== cycle?._id && item.status !== "closed",
	);

	return (
		<div className="space-y-8">
			<ActivityDashboard startupId={startup._id} />

			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div className="min-w-0 space-y-3">
					{cycle ? (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
									{cycle.title}
								</h1>
								{urgency ? (
									<Badge
										variant={urgency === "overdue" ? "outline" : "secondary"}
									>
										{urgency === "overdue" ? "Overdue" : "Ending soon"}
									</Badge>
								) : null}
							</div>
							<p className="text-muted-foreground">
								{formatDateRange(cycle.startAt, cycle.endAt)}
								{cycle.status === "active" && remaining >= 0
									? ` · ${remaining} day${remaining === 1 ? "" : "s"} left`
									: ` · ${cycle.status}`}
							</p>
						</>
					) : (
						<>
							<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
								Cycle
							</h1>
							<p className="text-muted-foreground">
								Internal execution for {startup.name}.
							</p>
						</>
					)}
				</div>

				<div className="flex flex-wrap gap-2">
					{isFounder && cycle?.status === "planned" ? (
						<Button
							type="button"
							onClick={() => void startCycle({ cycleId: cycle._id })}
						>
							Start Cycle
						</Button>
					) : null}
					{isFounder && cycle?.status === "active" ? (
						<div className="flex flex-wrap items-center gap-2">
							{carryOverTargets.length > 0 ? (
								<select
									value={carryOverTo}
									onChange={(event) => setCarryOverTo(event.target.value)}
									className="h-9 rounded-md border border-input bg-background px-2 text-sm"
								>
									<option value="">Leave unfinished Pulses here</option>
									{carryOverTargets.map((item) => (
										<option key={item._id} value={item._id}>
											Move unfinished to "{item.title}"
										</option>
									))}
								</select>
							) : null}
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									void closeCycle({
										cycleId: cycle._id,
										carryOverToCycleId: carryOverTo
											? (carryOverTo as Id<"cycles">)
											: undefined,
									})
								}
							>
								Close Cycle
							</Button>
						</div>
					) : null}
				</div>
			</div>

			{cycles.length > 1 ? (
				<div className="flex gap-4 overflow-x-auto text-sm">
					{cycles.map((item) => {
						const itemUrgency = cycleUrgency(item.endAt, item.status);
						return (
							<button
								key={item._id}
								type="button"
								className={cn(
									"flex shrink-0 items-center gap-1.5 pb-1",
									item._id === cycle?._id
										? "border-b border-foreground text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
								onClick={() => selectCycle(item._id)}
							>
								{item.title}
								{itemUrgency ? (
									<Badge
										variant={
											itemUrgency === "overdue" ? "outline" : "secondary"
										}
									>
										{itemUrgency === "overdue" ? "Overdue" : "Ending soon"}
									</Badge>
								) : null}
							</button>
						);
					})}
				</div>
			) : null}

			{cycle ? (
				<CyclePulseBoard
					startupId={startup._id}
					cycleId={cycle._id}
					canCreate={cycle.status !== "closed"}
					isFounder={isFounder}
				/>
			) : !isFounder ? (
				<p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
					No Cycle is running yet. The founder opens the next one.
				</p>
			) : null}

			{isFounder && (!cycle || cycle.status === "closed") ? (
				<StartCycleForm startupId={startup._id} />
			) : null}
		</div>
	);
}
