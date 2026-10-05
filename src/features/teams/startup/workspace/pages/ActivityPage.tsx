import { ActivityDashboard } from "~/features/teams/startup/workspace/components/ActivityDashboard";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/** What's been happening in the Startup, for every member. */
export function ActivityPage() {
	const { member } = useStartupRoute();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<h1 className="text-xl font-semibold">Activity</h1>
			<ActivityDashboard startupId={member?.startup._id} />
		</div>
	);
}
