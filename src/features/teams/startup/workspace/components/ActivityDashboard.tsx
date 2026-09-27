import type { Id } from "@convex/_generated/dataModel";
import { useActivityDashboard } from "~/features/teams/startup/workspace/hooks/useActivityDashboard";
import { formatDate } from "~/lib/dates";

type ActivityDashboardProps = {
	readonly startupId: Id<"startups"> | undefined;
};

const STAT_LABELS = [
	{ key: "teamSize", label: "Team size" },
	{ key: "activeCycles", label: "Active Cycles" },
	{ key: "verifiedPulsesLast30Days", label: "Verified Pulses (30d)" },
	{ key: "openRoles", label: "Open Roles" },
	{ key: "openTrialCycles", label: "Open Trial Cycles" },
] as const;

export function ActivityDashboard({ startupId }: ActivityDashboardProps) {
	const { dashboard, isLoading } = useActivityDashboard(startupId);

	if (isLoading || !dashboard) {
		return null;
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

			{dashboard.activity.length > 0 ? (
				<div className="space-y-2">
					<h2 className="text-sm font-medium text-muted-foreground">
						Activity
					</h2>
					<ul className="space-y-1">
						{dashboard.activity.map((item) => (
							<li
								key={item._id}
								className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-2 text-sm"
							>
								<span>{item.summary}</span>
								<span className="text-muted-foreground">
									{formatDate(item.createdAt)}
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}
