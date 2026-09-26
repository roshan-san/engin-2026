import { Bell, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useNotifications } from "~/features/app/hooks/useNotifications";

export function NotificationBell() {
	const { invites, notifications, count, acceptingId, accept, read } =
		useNotifications();
	const isLoading = invites === undefined || notifications === undefined;
	const isEmpty =
		!isLoading && invites.length === 0 && notifications.length === 0;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="relative size-8 rounded-full"
					aria-label={
						count > 0
							? `${count} pending notification${count === 1 ? "" : "s"}`
							: "Notifications"
					}
				>
					<Bell className="size-4" />
					{count > 0 && (
						<span
							className="absolute -right-0.5 -top-0.5 flex size-2.5 rounded-full bg-destructive ring-2 ring-background"
							aria-hidden
						/>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<DropdownMenuLabel className="font-normal">
					<span className="font-medium">Notifications</span>
					{count > 0 && (
						<span className="ml-2 text-xs text-muted-foreground">
							{count} pending
						</span>
					)}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{isLoading ? (
					<p className="px-2 py-3 text-sm text-muted-foreground">Loading...</p>
				) : isEmpty ? (
					<p className="px-2 py-3 text-sm text-muted-foreground">
						No notifications
					</p>
				) : (
					<ul className="max-h-72 overflow-y-auto">
						{invites.map((invite) => (
							<li
								key={invite._id}
								className="flex items-start gap-2 border-b border-border/60 px-2 py-3 last:border-0"
							>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium leading-snug">
										Join {invite.startupName}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{invite.inviterName} invited you as {invite.role}
									</p>
								</div>
								<Button
									type="button"
									size="icon-sm"
									className="shrink-0 rounded-full"
									disabled={acceptingId === invite._id}
									aria-label={`Accept invite to ${invite.startupName}`}
									onClick={() => accept(invite._id)}
								>
									<Check className="size-4" />
								</Button>
							</li>
						))}
						{notifications.map((notification) => (
							<li
								key={notification._id}
								className="border-b border-border/60 last:border-0"
							>
								{notification.href ? (
									<a
										href={notification.href}
										className="block px-2 py-3 hover:bg-muted/40"
										onClick={() => {
											if (!notification.isRead) {
												void read(notification._id);
											}
										}}
									>
										<p className="text-sm font-medium leading-snug">
											{notification.title}
										</p>
									</a>
								) : (
									<p className="px-2 py-3 text-sm font-medium">
										{notification.title}
									</p>
								)}
							</li>
						))}
					</ul>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
