import { PageHeader } from "~/components/shared/PageHeader";
import { ActivityDashboard } from "~/features/teams/startup/workspace/components/ActivityDashboard";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/** What's been happening in the Startup, for every member. */
export function ActivityPage() {
	const { member } = useStartupRoute();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<PageHeader hidden title="Activity" />
			<ActivityDashboard startupId={member?.startup._id} />
		</div>
	);
}
