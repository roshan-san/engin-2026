import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { formatDate, formatRelativeTime } from "~/lib/dates";
import { cn } from "~/lib/utils";

export type InboxNotification = {
	readonly _id: Id<"notifications">;
	readonly title: string;
	readonly body: string | null;
	readonly href: string | null;
	readonly createdAt: number;
	readonly isRead: boolean;
};

type NotificationListProps = {
	readonly notifications: InboxNotification[];
	readonly onRead: (id: Id<"notifications">) => void;
};

/** Newest first; opening a linked notification marks it read. */
export function NotificationList({
	notifications,
	onRead,
}: NotificationListProps) {
	return (
		<ul className="divide-y rounded-lg border">
			{notifications.map((notification) => (
				<li
					key={notification._id}
					className={cn(
						"flex items-start gap-3 p-3",
						!notification.isRead && "bg-muted/40",
					)}
				>
					<span
						aria-hidden
						className={cn(
							"mt-2 size-2 shrink-0 rounded-full",
							notification.isRead ? "bg-transparent" : "bg-primary",
						)}
					/>
					<div className="min-w-0 flex-1">
						{notification.href ? (
							<Link
								to={notification.href}
								onClick={() => {
									if (!notification.isRead) {
										onRead(notification._id);
									}
								}}
								className="block break-words font-medium underline-offset-4 hover:underline"
							>
								{notification.title}
							</Link>
						) : (
							<p className="break-words font-medium">{notification.title}</p>
						)}
						{notification.body ? (
							<p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
								{notification.body}
							</p>
						) : null}
						<time
							dateTime={new Date(notification.createdAt).toISOString()}
							title={formatDate(notification.createdAt)}
							className="text-xs text-muted-foreground"
						>
							{notification.isRead ? "" : "Unread · "}
							{formatRelativeTime(notification.createdAt)}
						</time>
					</div>
					{notification.isRead ? null : (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							className="shrink-0"
							onClick={() => onRead(notification._id)}
						>
							Mark read
						</Button>
					)}
				</li>
			))}
		</ul>
	);
}
