import { cn } from "~/lib/utils";

type LiveStatus = "draft" | "open" | "active" | "closed" | "cancelled";

const BADGE: Record<LiveStatus, { label: string; text: string; dot: string }> =
	{
		draft: {
			label: "Unpublished",
			text: "text-muted-foreground",
			dot: "bg-muted-foreground",
		},
		open: {
			label: "Accepting applications",
			text: "text-success",
			dot: "bg-success",
		},
		active: { label: "Live", text: "text-primary", dot: "bg-primary" },
		closed: {
			label: "Closed",
			text: "text-muted-foreground",
			dot: "bg-muted-foreground",
		},
		cancelled: {
			label: "Cancelled",
			text: "text-muted-foreground",
			dot: "bg-muted-foreground",
		},
	};

/** A hackathon's state as a coloured label. Live gets a pulsing dot. */
export function LiveBadge({ status }: { readonly status: LiveStatus }) {
	const { label, text, dot } = BADGE[status];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em]",
				text,
			)}
		>
			<span
				aria-hidden
				className={cn(
					"size-1.5 rounded-full",
					dot,
					status === "active" && "animate-pulse",
				)}
			/>
			{label}
		</span>
	);
}
