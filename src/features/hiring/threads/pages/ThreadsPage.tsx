import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Badge } from "~/components/ui/badge";
import { useThreads } from "~/features/hiring/threads/hooks/useThreads";
import { HACKATHON_STATUS_LABELS } from "~/features/hiring/hackathons/constants";
import { formatDate, formatRelativeTime } from "~/lib/dates";

/** One thread per Hackathon the user reads Announcements of. */
export function ThreadsPage() {
	const { threads } = useThreads();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<div>
				<h1 className="text-xl font-semibold">Threads</h1>
				<p className="text-sm text-muted-foreground">
					Announcements from the Founders of every Hackathon you're in.
				</p>
			</div>
			{threads === undefined ? (
				<PageLoading rows={3} />
			) : threads.length === 0 ? (
				<EmptyState
					title="No Threads yet"
					description="Once you join a hackathon, or your startup publishes one, its announcements show up here."
				/>
			) : (
				<ul className="divide-y rounded-lg border">
					{threads.map((thread) => (
						<li key={thread.hackathonId}>
							<Link
								to="/threads/$hackathonId"
								params={{ hackathonId: thread.hackathonId }}
								className="block space-y-1 p-3 hover:bg-muted/40"
							>
								<div className="flex items-start justify-between gap-2">
									<p className="min-w-0 break-words font-medium">
										{thread.title}
									</p>
									<Badge variant="secondary" className="shrink-0">
										{HACKATHON_STATUS_LABELS[thread.status]}
									</Badge>
								</div>
								<p className="text-sm break-words text-muted-foreground">
									{thread.startupName} · {thread.announcementCount}{" "}
									{thread.announcementCount === 1
										? "announcement"
										: "announcements"}
								</p>
								{thread.latest ? (
									<p className="flex min-w-0 gap-2 text-sm">
										<span className="min-w-0 flex-1 truncate">
											{thread.latest.body}
										</span>
										<time
											dateTime={new Date(thread.latest.createdAt).toISOString()}
											title={formatDate(thread.latest.createdAt)}
											className="shrink-0 text-xs text-muted-foreground"
										>
											{formatRelativeTime(thread.latest.createdAt)}
										</time>
									</p>
								) : (
									<p className="text-sm text-muted-foreground">
										No announcements yet.
									</p>
								)}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
