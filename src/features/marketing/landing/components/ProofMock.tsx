import { Leaderboard } from "~/components/shared/Leaderboard";
import { Row, RowList } from "~/components/shared/RowList";
import { ScoreBadge } from "~/components/shared/ScoreBadge";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { StatusDot } from "~/components/shared/StatusDot";

const PROOF = [
	{ title: "Rebuilt the signup flow", meta: "Pull request · verified" },
	{ title: "Shipped the billing page", meta: "Deploy · verified" },
	{ title: "Designed the onboarding", meta: "Design · verified" },
] as const;

const TOP = [
	{ key: "maya", rank: 1, name: "Maya R.", value: "Score 912" },
	{ key: "dev", rank: 2, name: "Dev K.", value: "Score 874" },
	{ key: "sam", rank: 3, name: "Sam T.", value: "Score 851" },
] as const;

/** A static profile: Score, verified proof of work and a hackathon leaderboard. */
export function ProofMock() {
	return (
		<div className="space-y-6 px-2">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm font-medium">Maya R.</p>
				<ScoreBadge score={912} />
			</div>
			<div className="space-y-2">
				<SectionLabel as="p">Proof of work</SectionLabel>
				<RowList>
					{PROOF.map((item) => (
						<Row
							key={item.title}
							leading={<StatusDot status="done" />}
							title={item.title}
							meta={item.meta}
						/>
					))}
				</RowList>
			</div>
			<div className="space-y-2">
				<SectionLabel as="p">Leaderboard</SectionLabel>
				<Leaderboard entries={TOP} />
			</div>
		</div>
	);
}
