import { SCORE_WEIGHTS } from "@convex/people/scoreWeights.rules";
import { Badge } from "~/components/ui/badge";

export type ScoreEvidence = {
	score: number;
	hackathonsPassed: number;
	startups: number;
	teamConversions: number;
	hackathonsLeft: number;
};

type ScoreEvidenceProps = {
	readonly evidence: ScoreEvidence;
};

/** The counts behind a Score, as chips for the profile hero. */
export function ScoreEvidenceChips({ evidence }: ScoreEvidenceProps) {
	const stats = [
		{ label: "Hackathons passed", value: evidence.hackathonsPassed },
		{ label: "Offers accepted", value: evidence.teamConversions },
		{ label: "Startups", value: evidence.startups },
		{ label: "Hackathons left", value: evidence.hackathonsLeft },
	];

	return (
		<ul className="flex flex-wrap gap-2">
			{stats.map((stat) => (
				<li key={stat.label}>
					<Badge variant="outline" className="tabular-nums">
						{stat.value} {stat.label}
					</Badge>
				</li>
			))}
		</ul>
	);
}

/** How Score is earned, in one muted line. */
export function ScoreEvidenceNote() {
	return (
		<p className="text-xs text-muted-foreground">
			Score is earned only from Founder Verdicts: +{SCORE_WEIGHTS.passedVerdict}{" "}
			per passed Hackathon, +{SCORE_WEIGHTS.acceptedOffer} per accepted Offer,{" "}
			{SCORE_WEIGHTS.leaving} for leaving a started Hackathon. It cannot be
			claimed or bought.
		</p>
	);
}
