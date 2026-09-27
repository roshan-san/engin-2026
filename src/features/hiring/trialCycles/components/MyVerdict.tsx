import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Button } from "~/components/ui/button";
import {
	type Verdict,
	verdictLabel,
} from "~/features/hiring/trialCycles/constants";

type MyVerdictProps = {
	readonly applicationId: Id<"applications">;
	readonly verdict: Verdict;
	readonly evaluation: string | null;
	readonly isEvaluationPublic: boolean;
	readonly isPending: boolean;
	readonly run: (action: () => Promise<unknown>, fallback: string) => void;
};

export function MyVerdict({
	applicationId,
	verdict,
	evaluation,
	isEvaluationPublic,
	isPending,
	run,
}: MyVerdictProps) {
	const setVisibility = useMutation(
		api.hiring.applications.setEvaluationVisibility,
	);

	return (
		<section className="space-y-3 rounded-lg border p-4">
			<h2 className="text-lg font-semibold">
				Your Verdict: {verdictLabel(verdict)}
			</h2>
			{evaluation ? (
				<>
					<p className="whitespace-pre-wrap text-sm leading-relaxed">
						{evaluation}
					</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={isPending}
						onClick={() =>
							run(
								() =>
									setVisibility({
										applicationId,
										isPublic: !isEvaluationPublic,
									}),
								"Could not update your profile",
							)
						}
					>
						{isEvaluationPublic ? "Hide from profile" : "Show on profile"}
					</Button>
				</>
			) : null}
		</section>
	);
}
