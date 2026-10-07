import type { Id } from "@convex/_generated/dataModel";
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
		<section className="space-y-3">
			<h2 className="text-lg font-semibold">Evaluations</h2>
			{evaluations === undefined ? null : evaluations.length === 0 ? (
				<p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
					No evaluations yet. Founders' written evaluations appear here after a
					Hackathon closes.
				</p>
			) : (
				<ul className="space-y-2">
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
				</ul>
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
		<li className="space-y-2 rounded-lg border p-4">
			<div>
				<p className="font-medium break-words">
					{hackathonTitle} · {startupName}
				</p>
				{verdict ? (
					<p className="text-sm text-muted-foreground">
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
