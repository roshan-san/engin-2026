import { Link } from "@tanstack/react-router";
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

export function HackathonHistory({ hackathonHistory }: HackathonHistoryProps) {
	return (
		<section className="space-y-3">
			<h2 className="text-lg font-semibold">Hackathons</h2>
			{hackathonHistory.length === 0 ? (
				<p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
					No Hackathon verdicts yet.
				</p>
			) : (
				<ul className="space-y-2">
					{hackathonHistory.map((item) => (
						<li key={item._id} className="rounded-lg border p-4">
							<p className="font-medium break-words">
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
							<p className="text-sm text-muted-foreground">
								{item.outcome === "left"
									? "Left after it started"
									: verdictLabel(item.outcome)}
							</p>
							{item.outcome !== "left" &&
							item.outcome !== "not_passed" &&
							!item.earnsScore ? (
								<p className="text-xs text-muted-foreground">
									No Score: on the team at close
								</p>
							) : null}
							{item.evaluation ? (
								<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed break-words">
									{item.evaluation}
								</p>
							) : null}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
