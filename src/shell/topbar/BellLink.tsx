import { Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { useNotifications } from "~/shell/hooks/useNotifications";

/** Inbox link with an azure unread count. */
export function BellLink() {
	const { count, countLabel, isLoading } = useNotifications();
	const showBadge = !isLoading && count > 0;

	return (
		<Link
			to="/inbox"
			aria-label={showBadge ? `Inbox, ${countLabel} unread` : "Inbox"}
			className="relative flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
		>
			<Inbox className="size-[18px]" />
			{showBadge ? (
				<span className="absolute top-0.5 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
					{countLabel}
				</span>
			) : null}
		</Link>
	);
}
