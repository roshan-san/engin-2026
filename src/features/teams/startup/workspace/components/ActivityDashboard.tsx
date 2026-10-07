import type { Id } from "@convex/_generated/dataModel";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { useActivityDashboard } from "~/features/teams/startup/workspace/hooks/useActivityDashboard";
import { formatDate } from "~/lib/dates";

type ActivityDashboardProps = {
	readonly startupId: Id<"startups"> | undefined;
};

const STAT_LABELS = [
	{ key: "teamSize", label: "Team size" },
	{ key: "activeCycles", label: "Active Cycles" },
	{ key: "verifiedTasksLast30Days", label: "Verified Tasks (30d)" },
	{ key: "openRoles", label: "Open Roles" },
	{ key: "openHackathons", label: "Open Hackathons" },
] as const;

/** Headline stats and the most recent events the viewer may see. */
export function ActivityDashboard({ startupId }: ActivityDashboardProps) {
	const { dashboard, isLoading } = useActivityDashboard(startupId);

	if (isLoading || !dashboard) {
		return <PageLoading rows={4} />;
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				{STAT_LABELS.map(({ key, label }) => (
					<div key={key} className="rounded-xl border border-border p-4">
						<p className="text-2xl font-bold">{dashboard.stats[key]}</p>
						<p className="mt-1 text-sm text-muted-foreground">{label}</p>
					</div>
				))}
			</div>

			<section className="space-y-2">
				<h2 className="text-sm font-medium text-muted-foreground">Recent</h2>
				{dashboard.activity.length === 0 ? (
					<EmptyState
						title="No activity yet"
						description="Joins, Cycles, verified Tasks and hackathons will show up here."
					/>
				) : (
					<ul className="space-y-1">
						{dashboard.activity.map((item) => (
							<li
								key={item._id}
								className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-4 py-2 text-sm"
							>
								<span className="min-w-0 break-words">{item.summary}</span>
								<span className="shrink-0 text-muted-foreground">
									{formatDate(item.createdAt)}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
