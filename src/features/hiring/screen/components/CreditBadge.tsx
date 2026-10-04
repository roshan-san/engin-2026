import { Badge } from "~/components/ui/badge";
import { useCredits } from "~/features/hiring/screen/hooks/useCredits";

/** "2 hackathon credits": a count only, with no sources, expiries or codes. */
export function CreditBadge() {
	const { count } = useCredits(true);

	if (count === undefined) {
		return null;
	}
	return (
		<Badge variant="secondary">
			{count} hackathon {count === 1 ? "credit" : "credits"}
		</Badge>
	);
}
