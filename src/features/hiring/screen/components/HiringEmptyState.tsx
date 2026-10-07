import { Link } from "@tanstack/react-router";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
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
			<EmptyState
				title="No Hackathons yet"
				body="Your Founders' hiring Hackathons will show up here."
			/>
		);
	}

	return (
		<EmptyState
			title="Run your first hiring Hackathon"
			body={
				<>
					Pick a Role, set the dates and the Starter Tasks, and see how people
					actually work before you hire.
					{hasSignupCredit ? " Your first hackathon is on us." : null}
				</>
			}
			action={
				<Button asChild>
					<Link to="/s/$slug/hiring/new" params={{ slug }}>
						Set up a Hackathon
					</Link>
				</Button>
			}
		/>
	);
}
