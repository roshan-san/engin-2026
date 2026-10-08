import { Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { useNotifications } from "~/shell/hooks/useNotifications";

/** Inbox link with an unread count. */
export function BellLink() {
	const { count, countLabel, isLoading } = useNotifications();
	const showBadge = !isLoading && count > 0;

	return (
		<Link
			to="/inbox"
			aria-label={showBadge ? `Inbox, ${countLabel} unread` : "Inbox"}
			className="relative flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
		>
			<Inbox className="size-4" />
			{showBadge ? (
				<span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-medium text-primary-foreground ring-2 ring-background">
					{countLabel}
				</span>
			) : null}
		</Link>
	);
}
