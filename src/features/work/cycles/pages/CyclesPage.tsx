import { PageLoading } from "~/components/globals/PageLoading";
import { PageHeader } from "~/components/shared/PageHeader";
import { EmptyState } from "~/components/shared/EmptyState";
import { RowList } from "~/components/shared/RowList";
import { CreateCycleDialog } from "~/features/work/cycles/components/CreateCycleDialog";
import { CycleRow } from "~/features/work/cycles/components/CycleRow";
import { CYCLE_STATUS_GROUPS } from "~/features/work/cycles/constants";
import { useCycles } from "~/features/work/cycles/hooks/useCycles";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/** The Startup's Cycles the viewer belongs to: Active first, then Planned, then Closed. */
export function CyclesPage() {
	const { slug, member } = useStartupRoute();
	const startupId = member?.startup._id;
	const isFounder = member?.role === "founder";
	const { cycles } = useCycles(startupId);
	const ordered = cycles
		? CYCLE_STATUS_GROUPS.flatMap((group) =>
				cycles.filter((cycle) => cycle.status === group.status),
			)
		: undefined;

	return (
		<div className="mx-auto w-full max-w-5xl space-y-4">
			<PageHeader
				hidden
				title="Cycles"
				actions={
					isFounder ? (
						<CreateCycleDialog slug={slug} startupId={startupId} />
					) : null
				}
			/>

			{ordered === undefined ? (
				<PageLoading rows={3} />
			) : ordered.length === 0 ? (
				<EmptyState
					title="No Cycles yet"
					body={
						isFounder
							? "Plan a Cycle to give the team a board to work on."
							: "You'll see Cycles here once a Founder adds you to one."
					}
				/>
			) : (
				<RowList>
					{ordered.map((cycle) => (
						<CycleRow key={cycle._id} slug={slug} cycle={cycle} />
					))}
				</RowList>
			)}
		</div>
	);
}
