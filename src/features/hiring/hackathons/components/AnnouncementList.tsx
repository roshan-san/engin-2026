import type { Id } from "@convex/_generated/dataModel";
import { formatDate, formatRelativeTime } from "~/lib/dates";

export type Announcement = {
	readonly _id: Id<"hackathonAnnouncements">;
	readonly body: string;
	readonly createdAt: number;
	readonly user: { name?: string | null; username?: string | null } | null;
};

type AnnouncementListProps = {
	readonly announcements: Announcement[] | undefined;
};

/** A hackathon's Announcements, newest first, each with its author and time. */
export function AnnouncementList({ announcements }: AnnouncementListProps) {
	if (announcements === undefined) {
		return <p className="text-sm text-muted-foreground">Loading…</p>;
	}
	if (announcements.length === 0) {
		return (
			<p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
				No announcements yet.
			</p>
		);
	}
	return (
		<ul className="space-y-2">
			{announcements.map((announcement) => (
				<li key={announcement._id} className="rounded-lg border p-3">
					<p className="flex flex-wrap items-baseline gap-x-2 text-sm">
						<span className="font-medium">
							{announcement.user?.name ??
								announcement.user?.username ??
								"A founder"}
						</span>
						<time
							dateTime={new Date(announcement.createdAt).toISOString()}
							title={formatDate(announcement.createdAt)}
							className="text-xs text-muted-foreground"
						>
							{formatRelativeTime(announcement.createdAt)}
						</time>
					</p>
					<p className="mt-1 whitespace-pre-wrap text-sm break-words">
						{announcement.body}
					</p>
				</li>
			))}
		</ul>
	);
}
