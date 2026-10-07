import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "~/components/ui/empty";
import { useCredits } from "~/features/hiring/screen/hooks/useCredits";

type HiringEmptyStateProps = {
	readonly slug: string;
	readonly isFounder: boolean;
};

/** The guided first step for a Startup with no hackathons yet. */
export function HiringEmptyState({ slug, isFounder }: HiringEmptyStateProps) {
	const { hasSignupCredit } = useCredits(isFounder);

	if (!isFounder) {
		return (
			<Empty className="border border-dashed">
				<EmptyHeader>
					<EmptyTitle>No Hackathons yet</EmptyTitle>
					<EmptyDescription>
						Your Founders' hiring Hackathons will show up here.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<Empty className="border border-dashed">
			<EmptyHeader>
				<EmptyTitle>Run your first hiring Hackathon</EmptyTitle>
				<EmptyDescription>
					Pick a Role, set the dates and the Starter Tasks, and see how people
					actually work before you hire.
					{hasSignupCredit ? " Your first hackathon is on us." : null}
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button asChild>
					<Link to="/s/$slug/hiring/new" params={{ slug }}>
						Set up a Hackathon
					</Link>
				</Button>
			</EmptyContent>
		</Empty>
	);
}
