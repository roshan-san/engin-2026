import type { Id } from "@convex/_generated/dataModel";
import { EmptyState } from "~/components/shared/EmptyState";
import { RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import {
	type Verdict,
	verdictLabel,
} from "~/features/hiring/hackathons/constants";
import { useEvaluationVisibility } from "~/features/hiring/hackathons/hooks/useEvaluationVisibility";
import { useMyEvaluations } from "~/features/people/profile/hooks/useMyEvaluations";

export function ProfileEvaluations() {
	const { evaluations } = useMyEvaluations();

	return (
		<section className="space-y-1">
			<SectionLabel>Evaluations</SectionLabel>
			{evaluations === undefined ? null : evaluations.length === 0 ? (
				<EmptyState
					title="No evaluations yet."
					body="Founders' written evaluations appear here after a Hackathon closes."
				/>
			) : (
				<RowList>
					{evaluations.map((item) => (
						<EvaluationRow
							key={item._id}
							applicationId={item._id}
							hackathonTitle={item.hackathonTitle ?? "Hackathon"}
							startupName={item.startupName}
							verdict={item.verdict}
							evaluation={item.evaluation}
							isPublic={item.evaluationPublic}
						/>
					))}
				</RowList>
			)}
		</section>
	);
}

type EvaluationRowProps = {
	readonly applicationId: Id<"applications">;
	readonly hackathonTitle: string;
	readonly startupName: string;
	readonly verdict: Verdict | null;
	readonly evaluation: string;
	readonly isPublic: boolean;
};

function EvaluationRow({
	applicationId,
	hackathonTitle,
	startupName,
	verdict,
	evaluation,
	isPublic,
}: EvaluationRowProps) {
	const { setPublic, isPending } = useEvaluationVisibility(applicationId);

	return (
		<li className="space-y-2 px-2 py-4">
			<div>
				<p className="text-sm font-medium break-words">
					{hackathonTitle} · {startupName}
				</p>
				{verdict ? (
					<p className="text-xs text-muted-foreground">
						{verdictLabel(verdict)}
					</p>
				) : null}
			</div>
			<p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
				{evaluation}
			</p>
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={isPending}
				onClick={() => void setPublic(!isPublic)}
			>
				{isPublic ? "Hide from profile" : "Show on profile"}
			</Button>
		</li>
	);
}
