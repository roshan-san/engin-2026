import type { Id } from "@convex/_generated/dataModel";
import { EmptyState } from "~/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatDate, formatRelativeTime } from "~/lib/dates";

export type ThreadMessage = {
	readonly _id: Id<"hackathonAnnouncements">;
	readonly body: string;
	readonly createdAt: number;
	readonly user: {
		name?: string | null;
		username?: string | null;
		image?: string | null;
	} | null;
};

type ThreadMessagesProps = {
	readonly announcements: ThreadMessage[];
};

/** A thread's Announcements as a chat column: author avatar, name, time, then the message. */
export function ThreadMessages({ announcements }: ThreadMessagesProps) {
	if (announcements.length === 0) {
		return <EmptyState title="No announcements yet." />;
	}
	return (
		<ul className="space-y-5">
			{announcements.map((announcement) => {
				const name =
					announcement.user?.name ?? announcement.user?.username ?? "A founder";
				return (
					<li key={announcement._id} className="flex items-start gap-3">
						<Avatar className="size-8 rounded-full">
							{announcement.user?.image ? (
								<AvatarImage src={announcement.user.image} alt="" />
							) : null}
							<AvatarFallback className="text-xs">
								{name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<p className="flex flex-wrap items-baseline gap-x-2 text-sm">
								<span className="font-medium">{name}</span>
								<time
									dateTime={new Date(announcement.createdAt).toISOString()}
									title={formatDate(announcement.createdAt)}
									className="text-xs text-muted-foreground"
								>
									{formatRelativeTime(announcement.createdAt)}
								</time>
							</p>
							<p className="mt-0.5 whitespace-pre-wrap break-words text-sm">
								{announcement.body}
							</p>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
