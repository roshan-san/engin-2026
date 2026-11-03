import { trustLines } from "~/shared/lib/trust";
import { useMyTrust } from "../api/useMyTrust";

/** On your own profile only: the Trust rule you meet, what's left for the next level, and how it falls. */
export function YourTrust() {
	const mine = useMyTrust();
	if (!mine) {
		return null;
	}
	const { now, next } = trustLines(mine);

	return (
		<section
			aria-label="Your Trust"
			className="flex flex-col gap-1 rounded-lg border p-3 text-sm"
		>
			<p className="font-medium">{now}</p>
			{next ? <p className="text-muted-foreground">Next, {next}</p> : null}
			<p className="text-xs text-muted-foreground">
				Trust drops a level after 12 weeks with no work approved by someone
				else.
			</p>
		</section>
	);
}
