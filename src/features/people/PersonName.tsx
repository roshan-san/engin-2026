import { tierText } from "~/features/work";
import { displayName } from "~/lib/displayName";
import { cn } from "~/lib/utils";

/** A person's name in their Rating's Tier colour; "Someone" when there's nobody. */
export function PersonName({
	person,
	className,
}: {
	readonly person: {
		name: string | null;
		username: string | null;
		rating: number;
	} | null;
	readonly className?: string;
}) {
	return (
		<span className={cn(person && tierText(person.rating), className)}>
			{displayName(person)}
		</span>
	);
}
