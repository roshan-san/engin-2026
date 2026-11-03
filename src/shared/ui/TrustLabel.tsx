import type { Trust } from "@convex/momentum/rules";
import { cn } from "~/shared/lib/cn";
import { trustLabel } from "~/shared/lib/trust";

/** "Trust: Mid", beside a Momentum: how believable the Record behind it is. */
export function TrustLabel({
	trust,
	label = "Trust",
	className,
}: {
	readonly trust: Trust;
	readonly label?: string;
	readonly className?: string;
}) {
	return (
		<span className={cn("text-sm text-muted-foreground", className)}>
			{label}:{" "}
			<span className="font-medium text-foreground">{trustLabel(trust)}</span>
		</span>
	);
}
