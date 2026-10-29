import { cn } from "~/shared/lib/cn";
import { displayName } from "~/shared/lib/displayName";
import { tierText } from "~/shared/lib/tierText";

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
