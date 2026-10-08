import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { HACKATHON_STATUS_LABELS } from "~/features/hiring/hackathons/constants";
import { ThreadMessages } from "~/features/hiring/threads/components/ThreadMessages";
import { useThread } from "~/features/hiring/threads/hooks/useThread";

type ThreadPageProps = {
	readonly hackathonId: string;
};

/** A hackathon's Announcements, read-only; founders post on the Hackathon screen. */
export function ThreadPage({ hackathonId }: ThreadPageProps) {
	const { thread } = useThread(hackathonId);
	const back = (
		<Link
			to="/threads"
			className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft className="size-4" />
			Threads
		</Link>
	);

	return (
		<>
			{thread === undefined ? (
				<Page width="narrow" className="space-y-6">
					{back}
					<PageLoading rows={3} />
				</Page>
			) : (
				<>
					<PageHeader
						width="narrow"
						eyebrow={back}
						title={thread.title}
						meta={`${thread.startupName} · ${HACKATHON_STATUS_LABELS[thread.status]}`}
						actions={
							<Button asChild size="sm" variant="outline">
								<Link to={thread.href}>Open Hackathon</Link>
							</Button>
						}
					/>
					<Page width="narrow">
						<ThreadMessages announcements={thread.announcements} />
					</Page>
				</>
			)}
		</>
	);
}
