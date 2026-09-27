import { SCORE_WEIGHTS } from "@convex/lib/reputation/scoreWeights";
import { Badge } from "~/components/ui/badge";

export type ScoreEvidence = {
	score: number;
	trialCyclesPassed: number;
	startups: number;
	teamConversions: number;
	trialCyclesLeft: number;
};

type ScoreEvidenceCardProps = {
	readonly evidence: ScoreEvidence;
};

export function ScoreEvidenceCard({ evidence }: ScoreEvidenceCardProps) {
	const stats = [
		{ label: "Trial Cycles passed", value: evidence.trialCyclesPassed },
		{ label: "Offers accepted", value: evidence.teamConversions },
		{ label: "Startups", value: evidence.startups },
		{ label: "Trial Cycles left", value: evidence.trialCyclesLeft },
	];

	return (
		<div className="space-y-4 rounded-lg border p-6">
			<div>
				<p className="text-sm text-muted-foreground">Engin Score</p>
				<p className="text-4xl font-bold tabular-nums">{evidence.score}</p>
			</div>
			<ul className="flex flex-wrap gap-2">
				{stats.map((stat) => (
					<li key={stat.label}>
						<Badge variant="secondary">
							{stat.value} {stat.label}
						</Badge>
					</li>
				))}
			</ul>
			<p className="text-sm text-muted-foreground">
				Earned only from Founder Verdicts: +{SCORE_WEIGHTS.passedVerdict} per
				passed Trial Cycle, +{SCORE_WEIGHTS.acceptedOffer} per accepted Offer,{" "}
				{SCORE_WEIGHTS.leaving} for leaving a started Trial Cycle. It cannot be
				claimed or bought.
			</p>
		</div>
	);
}
