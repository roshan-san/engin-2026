import { Section } from "~/components/Section";
import { useBoardScope } from "~/features/work/board/BoardScope";
import { useBoardCards } from "~/features/work/board/useBoard";
import { dayLabel } from "~/lib/dates";
import { buildDaysLabel, lastDay } from "../hackathonDates";

/** What a Participant keeps coming back to: how far they've got, the problem, and how it ends. */
export function ParticipantBrief({
	hackathon,
}: {
	readonly hackathon: {
		readonly problem: string;
		readonly startsAt: number;
		readonly endsAt: number;
		readonly decideBy: number;
		readonly participantsGet: string | null;
	};
}) {
	const cards = useBoardCards(useBoardScope());
	const done = cards?.filter((card) => card.status === "done").length ?? 0;
	const total = cards?.length ?? 0;
	const hasStarted = Date.now() >= hackathon.startsAt;

	return (
		<div className="flex flex-col gap-10">
			<section className="flex flex-col gap-2">
				<p className="flex items-baseline justify-between gap-3 text-sm">
					<span className="font-medium">
						{cards === undefined
							? null
							: total === 0 && !hasStarted
								? `Your Cards arrive ${dayLabel(hackathon.startsAt)}`
								: `${done} of ${total} Cards done`}
					</span>
					<span className="text-xs text-muted-foreground">
						{buildDaysLabel(hackathon.startsAt, hackathon.endsAt)}
					</span>
				</p>
				{total > 0 ? (
					<div
						role="progressbar"
						aria-label="Cards done"
						aria-valuemin={0}
						aria-valuemax={total}
						aria-valuenow={done}
						className="h-1.5 overflow-hidden rounded-full bg-muted"
					>
						<div
							className="h-full rounded-full bg-success transition-[width]"
							style={{ width: `${(done / total) * 100}%` }}
						/>
					</div>
				) : null}
			</section>

			<Section label="The problem" as="h3">
				<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
					{hackathon.problem}
				</p>
			</Section>

			<Section label="How it ends" as="h3">
				<ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm text-muted-foreground marker:text-subtle-foreground">
					<li>Ship each Card with what shipped. The Founder verifies it.</li>
					<li>Shortlisted Participants get a Walkthrough call.</li>
					<li>
						The decision comes by {dayLabel(lastDay(hackathon.decideBy))}.
					</li>
				</ul>
			</Section>

			{hackathon.participantsGet ? (
				<Section label="What Participants get" as="h3">
					<p className="text-sm">{hackathon.participantsGet}</p>
				</Section>
			) : null}
		</div>
	);
}
