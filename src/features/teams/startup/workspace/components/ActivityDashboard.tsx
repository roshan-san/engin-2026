import type { Id } from "@convex/_generated/dataModel";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { useActivityDashboard } from "~/features/teams/startup/workspace/hooks/useActivityDashboard";
import { formatDate, formatRelativeTime } from "~/lib/dates";

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
		<div className="space-y-8">
			<dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
				{STAT_LABELS.map(({ key, label }) => (
					<div key={key}>
						<dd className="text-xl font-semibold tabular-nums tracking-[-0.01em]">
							{dashboard.stats[key]}
						</dd>
						<dt className="mt-0.5 text-xs text-muted-foreground">{label}</dt>
					</div>
				))}
			</dl>

			<section className="space-y-1">
				<SectionLabel>Recent</SectionLabel>
				{dashboard.activity.length === 0 ? (
					<EmptyState
						title="No activity yet"
						body="Joins, Cycles, verified Tasks and hackathons will show up here."
					/>
				) : (
					<RowList>
						{dashboard.activity.map((item) => (
							<li
								key={item._id}
								className="flex items-start justify-between gap-3 px-2 py-3 text-sm"
							>
								<span className="min-w-0 break-words">{item.summary}</span>
								<time
									dateTime={new Date(item.createdAt).toISOString()}
									title={formatDate(item.createdAt)}
									className="shrink-0 text-xs text-muted-foreground"
								>
									{formatRelativeTime(item.createdAt)}
								</time>
							</li>
						))}
					</RowList>
				)}
			</section>
		</div>
	);
}
