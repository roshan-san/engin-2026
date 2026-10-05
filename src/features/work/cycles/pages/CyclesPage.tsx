import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { CreateCycleDialog } from "~/features/work/cycles/components/CreateCycleDialog";
import { CycleRow } from "~/features/work/cycles/components/CycleRow";
import { CYCLE_STATUS_GROUPS } from "~/features/work/cycles/constants";
import { useCycles } from "~/features/work/cycles/hooks/useCycles";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/** The Startup's Cycles the viewer belongs to: Active, Planned, Closed. */
export function CyclesPage() {
	const { slug, member } = useStartupRoute();
	const startupId = member?.startup._id;
	const isFounder = member?.role === "founder";
	const { cycles } = useCycles(startupId);

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-xl font-semibold">Cycles</h1>
				{isFounder ? (
					<CreateCycleDialog slug={slug} startupId={startupId} />
				) : null}
			</header>

			{cycles === undefined ? (
				<PageLoading rows={3} />
			) : cycles.length === 0 ? (
				<EmptyState
					title="No Cycles yet"
					description={
						isFounder
							? "Plan a Cycle to give the team a board to work on."
							: "You'll see Cycles here once a Founder adds you to one."
					}
				/>
			) : (
				CYCLE_STATUS_GROUPS.map((group) => {
					const items = cycles.filter((cycle) => cycle.status === group.status);
					if (items.length === 0) {
						return null;
					}
					return (
						<section key={group.status} className="space-y-2">
							<h2 className="text-sm font-medium text-muted-foreground">
								{group.label}
							</h2>
							<ul className="space-y-2">
								{items.map((cycle) => (
									<CycleRow key={cycle._id} slug={slug} cycle={cycle} />
								))}
							</ul>
						</section>
					);
				})
			)}
		</div>
	);
}
