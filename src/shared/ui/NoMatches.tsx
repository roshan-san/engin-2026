import { Button } from "./button";
import { EmptyState } from "./EmptyState";

/** Nothing matches the filters, with a way to clear them. */
export function NoMatches({
	noun,
	onClear,
}: {
	/** Plural, e.g. "hackathons". */
	readonly noun: string;
	readonly onClear: () => void;
}) {
	return (
		<EmptyState
			title={`No ${noun} match these filters`}
			action={
				<Button variant="outline" onClick={onClear}>
					Clear filters
				</Button>
			}
		/>
	);
}
