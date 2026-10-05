import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useThread } from "~/features/hiring/threads/hooks/useThread";
import { AnnouncementList } from "~/features/hiring/trialCycles/components/AnnouncementList";
import { TRIAL_STATUS_LABELS } from "~/features/hiring/trialCycles/constants";

type ThreadPageProps = {
	readonly trialCycleId: string;
};

/** A hackathon's Announcements, read-only; founders post on the Trial Cycle screen. */
export function ThreadPage({ trialCycleId }: ThreadPageProps) {
	const { thread } = useThread(trialCycleId);

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<Link
				to="/threads"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Threads
			</Link>
			{thread === undefined ? (
				<PageLoading rows={3} />
			) : (
				<>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div className="min-w-0 space-y-1">
							<h1 className="break-words text-xl font-semibold">
								{thread.title}
							</h1>
							<p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
								<span className="break-words">{thread.startupName}</span>
								<Badge variant="secondary">
									{TRIAL_STATUS_LABELS[thread.status]}
								</Badge>
							</p>
						</div>
						<Button asChild size="sm" variant="outline" className="self-start">
							<Link to={thread.href}>Open Trial Cycle</Link>
						</Button>
					</div>
					<p className="text-sm text-muted-foreground">
						Announcements from the founders to every Participant.
					</p>
					<AnnouncementList announcements={thread.announcements} />
				</>
			)}
		</div>
	);
}
