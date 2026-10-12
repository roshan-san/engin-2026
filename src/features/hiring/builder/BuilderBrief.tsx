import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PanelHeader } from "~/components/PanelHeader";
import { SectionLabel } from "~/components/SectionLabel";
import { Button } from "~/components/ui/button";
import { useBoardScope } from "~/features/work/board/BoardScope";
import { useBoardCards } from "~/features/work/board/useBoard";
import { buildDaysLabel, dayLabel, lastDay } from "../hackathonDates";

/**
 * What a Builder keeps coming back to: how far they've got, the problem,
 * and how it ends. Sits beside their Board.
 */
export function BuilderBrief({
	hackathon,
	title,
	onClose,
}: {
	readonly hackathon: {
		readonly problem: string;
		readonly startsAt: number;
		readonly endsAt: number;
		readonly decideBy: number;
		readonly buildersGet: string | null;
	};
	/** The panel switcher. */
	readonly title: ReactNode;
	/** On phone: closes the sheet. */
	readonly onClose?: () => void;
}) {
	const cards = useBoardCards(useBoardScope());
	const done = cards?.filter((card) => card.status === "done").length ?? 0;
	const total = cards?.length ?? 0;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<PanelHeader>
				{title}
				{onClose ? (
					<Button
						variant="ghost"
						size="icon-sm"
						className="ml-auto"
						aria-label="Close"
						onClick={onClose}
					>
						<XIcon />
					</Button>
				) : null}
			</PanelHeader>
			<div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-4">
				<section className="flex flex-col gap-2">
					<p className="flex items-baseline justify-between gap-3 text-sm">
						<span className="font-medium">
							{done} of {total} Cards done
						</span>
						<span className="text-xs text-muted-foreground">
							{buildDaysLabel(hackathon.startsAt, hackathon.endsAt)}
						</span>
					</p>
					<div className="h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-success transition-[width]"
							style={{ width: total > 0 ? `${(done / total) * 100}%` : 0 }}
						/>
					</div>
				</section>

				<section className="flex flex-col gap-2">
					<SectionLabel as="h3">The problem</SectionLabel>
					<p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
						{hackathon.problem}
					</p>
				</section>

				<section className="flex flex-col gap-2">
					<SectionLabel as="h3">How it ends</SectionLabel>
					<ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm text-muted-foreground marker:text-subtle-foreground">
						<li>Ship each Card with what shipped. The Founder verifies it.</li>
						<li>Shortlisted Builders get a Walkthrough call.</li>
						<li>
							The decision comes by {dayLabel(lastDay(hackathon.decideBy))}.
						</li>
					</ul>
				</section>

				{hackathon.buildersGet ? (
					<section className="flex flex-col gap-2">
						<SectionLabel as="h3">What Builders get</SectionLabel>
						<p className="text-sm">{hackathon.buildersGet}</p>
					</section>
				) : null}
			</div>
		</div>
	);
}
