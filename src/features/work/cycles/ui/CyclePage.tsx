import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Button } from "~/components/ui/button";
import { BuildFrame } from "~/features/app/layout/BuildFrame";
import { CyclePulseBoard } from "~/features/work/cycles/components/CyclePulseBoard";
import { StartCycleForm } from "~/features/work/cycles/components/StartCycleForm";
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

	if (isLoading) {
		return <PageLoading rows={4} />;
	}

	if (!startup) {
		return null;
	}

	const remaining = cycle ? daysRemaining(cycle.endAt) : 0;

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div className="min-w-0 space-y-3">
					{cycle ? (
						<>
							<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
								{cycle.title}
							</h1>
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
						<Button
							type="button"
							variant="outline"
							onClick={() => void closeCycle({ cycleId: cycle._id })}
						>
							Close Cycle
						</Button>
					) : null}
				</div>
			</div>

			{cycles.length > 1 ? (
				<div className="flex gap-4 overflow-x-auto text-sm">
					{cycles.map((item) => (
						<button
							key={item._id}
							type="button"
							className={cn(
								"shrink-0 pb-1",
								item._id === cycle?._id
									? "border-b border-foreground text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => selectCycle(item._id)}
						>
							{item.title}
						</button>
					))}
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
