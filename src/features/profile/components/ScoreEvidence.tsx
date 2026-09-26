import { Badge } from "~/components/ui/badge";

export type ScoreEvidence = {
	score: number;
	trialCyclesPassed: number;
	verifiedPulses: number;
	startups: number;
	completionRate: number | null;
	teamConversions: number;
	trialCyclesLeft: number;
};

type ScoreEvidenceCardProps = {
	readonly evidence: ScoreEvidence;
};

export function ScoreEvidenceCard({ evidence }: ScoreEvidenceCardProps) {
	const completion =
		evidence.completionRate === null
			? "—"
			: `${Math.round(evidence.completionRate * 100)}%`;

	const stats = [
		{ label: "Trial Cycles passed", value: evidence.trialCyclesPassed },
		{ label: "Verified Pulses", value: evidence.verifiedPulses },
		{ label: "Startups", value: evidence.startups },
		{ label: "Completion", value: completion },
		{ label: "Offers accepted", value: evidence.teamConversions },
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
				Earned from verified work with startups. It cannot be claimed or bought.
			</p>
		</div>
	);
}
