import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { Skeleton } from "~/components/ui/skeleton";
import { useWorkspace } from "../board/StartupContext";
import { ActivityFeed } from "./ActivityFeed";
import { useActivity } from "./hooks/useActivity";
import { useSignals } from "./hooks/useSignals";
import { RecordSignals } from "./RecordSignals";

/** The team's Record: the Rating and rhythm, then every Cycle. */
export function ActivityPage() {
	const { startup } = useWorkspace();
	const signals = useSignals(startup.slug);
	const { data, showEarlier } = useActivity(startup._id);

	return (
		<>
			<PageHeader
				title="Activity"
				width="narrow"
				actions={
					<a
						href={`/startups/${startup.slug}`}
						className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
					>
						How others see this ↗
					</a>
				}
			/>
			<Page width="narrow" className="flex flex-col gap-10">
				{signals ? (
					<RecordSignals signals={signals} />
				) : (
					<Skeleton className="h-24 w-64" />
				)}
				{data ? (
					<ActivityFeed
						cycles={data.cycles}
						hasMore={data.hasMore}
						onShowEarlier={showEarlier}
						mode="full"
					/>
				) : (
					<Skeleton className="h-40 w-full" />
				)}
			</Page>
		</>
	);
}
