import { Link } from "@tanstack/react-router";
import { EmptyState } from "~/components/shared/EmptyState";
import { RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Badge } from "~/components/ui/badge";
import {
	type Verdict,
	verdictLabel,
} from "~/features/hiring/hackathons/constants";

export type HackathonHistoryEntry = {
	_id: string;
	hackathonTitle: string;
	startupName: string;
	startupSlug: string | null;
	outcome: Verdict | "left";
	earnsScore: boolean;
	evaluation: string | null;
};

type HackathonHistoryProps = {
	readonly hackathonHistory: HackathonHistoryEntry[];
};

const OUTCOME_VARIANT = {
	passed_with_offer: "default",
	passed: "secondary",
	not_passed: "outline",
	left: "outline",
} as const;

export function HackathonHistory({ hackathonHistory }: HackathonHistoryProps) {
	return (
		<section className="space-y-1">
			<SectionLabel>Hackathons</SectionLabel>
			{hackathonHistory.length === 0 ? (
				<EmptyState title="No Hackathon verdicts yet." />
			) : (
				<RowList>
					{hackathonHistory.map((item) => (
						<li key={item._id} className="space-y-2 px-2 py-3">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-sm font-medium break-words">
										{item.hackathonTitle} ·{" "}
										{item.startupSlug ? (
											<Link
												to="/startup/$slug"
												params={{ slug: item.startupSlug }}
												className="hover:underline"
											>
												{item.startupName}
											</Link>
										) : (
											item.startupName
										)}
									</p>
									{item.outcome !== "left" &&
									item.outcome !== "not_passed" &&
									!item.earnsScore ? (
										<p className="mt-0.5 text-xs text-muted-foreground">
											No Score: on the team at close
										</p>
									) : null}
								</div>
								<Badge variant={OUTCOME_VARIANT[item.outcome]}>
									{item.outcome === "left"
										? "Left after it started"
										: verdictLabel(item.outcome)}
								</Badge>
							</div>
							{item.evaluation ? (
								<p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
									{item.evaluation}
								</p>
							) : null}
						</li>
					))}
				</RowList>
			)}
		</section>
	);
}
