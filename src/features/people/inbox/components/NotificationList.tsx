import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { RowList } from "~/components/shared/RowList";
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
		<RowList>
			{notifications.map((notification) => (
				<li key={notification._id} className="flex items-start gap-3 px-2 py-3">
					<span
						aria-hidden
						className={cn(
							"mt-1.5 size-2 shrink-0 rounded-full",
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
								className={cn(
									"block break-words text-sm underline-offset-4 hover:underline",
									notification.isRead ? "text-muted-foreground" : "font-medium",
								)}
							>
								{notification.title}
							</Link>
						) : (
							<p
								className={cn(
									"break-words text-sm",
									notification.isRead ? "text-muted-foreground" : "font-medium",
								)}
							>
								{notification.title}
							</p>
						)}
						{notification.body ? (
							<p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
								{notification.body}
							</p>
						) : null}
					</div>
					<div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
						<time
							dateTime={new Date(notification.createdAt).toISOString()}
							title={formatDate(notification.createdAt)}
							className="text-xs text-muted-foreground"
						>
							{formatRelativeTime(notification.createdAt)}
						</time>
						{notification.isRead ? null : (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								className="-my-1 h-7 px-2 text-xs"
								onClick={() => onRead(notification._id)}
							>
								Mark read
							</Button>
						)}
					</div>
				</li>
			))}
		</RowList>
	);
}
