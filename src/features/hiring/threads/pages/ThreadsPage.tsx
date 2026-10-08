import { Page } from "~/components/shared/Page";
import { MessagesSquare } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { Row, RowList } from "~/components/shared/RowList";
import { HACKATHON_STATUS_LABELS } from "~/features/hiring/hackathons/constants";
import { useThreads } from "~/features/hiring/threads/hooks/useThreads";
import { formatDate, formatRelativeTime } from "~/lib/dates";

/** One thread per Hackathon the user reads Announcements of. */
export function ThreadsPage() {
	const { threads } = useThreads();

	return (
		<>
			<PageHeader title="Threads" />
			<Page className="space-y-6">
				{threads === undefined ? (
					<PageLoading rows={3} />
				) : threads.length === 0 ? (
					<EmptyState
						icon={MessagesSquare}
						title="No Threads yet"
						body="Once you join a hackathon, or your startup publishes one, its announcements show up here."
					/>
				) : (
					<RowList>
						{threads.map((thread) => (
							<Row
								key={thread.hackathonId}
								to="/threads/$hackathonId"
								params={{ hackathonId: thread.hackathonId }}
								title={thread.title}
								meta={
									thread.latest
										? `${thread.startupName} · ${thread.latest.body}`
										: `${thread.startupName} · No announcements yet.`
								}
								trailing={
									<div className="flex flex-col items-end gap-0.5 text-xs">
										<span>{HACKATHON_STATUS_LABELS[thread.status]}</span>
										{thread.latest ? (
											<time
												dateTime={new Date(
													thread.latest.createdAt,
												).toISOString()}
												title={formatDate(thread.latest.createdAt)}
											>
												{formatRelativeTime(thread.latest.createdAt)}
											</time>
										) : null}
									</div>
								}
							/>
						))}
					</RowList>
				)}
			</Page>
		</>
	);
}
