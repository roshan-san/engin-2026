import { Badge } from "~/components/ui/badge";

/** A Team's name as a small label on a row. */
export function TeamChip({ name }: { readonly name: string }) {
	return (
		<Badge variant="secondary" className="max-w-32 truncate font-normal">
			{name}
		</Badge>
	);
}
