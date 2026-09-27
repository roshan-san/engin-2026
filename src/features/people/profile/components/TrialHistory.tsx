import {
	type Verdict,
	verdictLabel,
} from "~/features/hiring/trialCycles/constants";

type TrialHistoryProps = {
	readonly evaluations: Array<{
		_id: string;
		trialTitle: string;
		startupName: string;
		verdict: Verdict | null;
		evaluation: string;
	}>;
	readonly trialCyclesLeft: Array<{
		_id: string;
		trialTitle: string;
		startupName: string;
	}>;
};

export function TrialHistory({
	evaluations,
	trialCyclesLeft,
}: TrialHistoryProps) {
	if (evaluations.length === 0 && trialCyclesLeft.length === 0) {
		return null;
	}

	return (
		<section className="space-y-3">
			<h2 className="text-lg font-semibold">Trial Cycles</h2>
			<ul className="space-y-2">
				{evaluations.map((item) => (
					<li key={item._id} className="rounded-lg border p-4">
						<p className="font-medium">
							{item.trialTitle} · {item.startupName}
						</p>
						{item.verdict ? (
							<p className="text-sm text-muted-foreground">
								{verdictLabel(item.verdict)}
							</p>
						) : null}
						<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
							{item.evaluation}
						</p>
					</li>
				))}
				{trialCyclesLeft.map((item) => (
					<li key={item._id} className="rounded-lg border p-4">
						<p className="font-medium">
							{item.trialTitle} · {item.startupName}
						</p>
						<p className="text-sm text-muted-foreground">
							Left after it started
						</p>
					</li>
				))}
			</ul>
		</section>
	);
}
