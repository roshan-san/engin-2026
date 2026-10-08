import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { ActivityDashboard } from "~/features/teams/startup/workspace/components/ActivityDashboard";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/** What's been happening in the Startup, for every member. */
export function ActivityPage() {
	const { member } = useStartupRoute();

	return (
		<>
			<PageHeader width="narrow" title="Activity" />
			<Page width="narrow" className="space-y-6">
				<ActivityDashboard startupId={member?.startup._id} />
			</Page>
		</>
	);
}
