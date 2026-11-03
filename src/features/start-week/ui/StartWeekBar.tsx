import { useBoardCards, useBoardScope } from "~/entities/card";
import { useTeamPeople } from "~/entities/contributor";
import { useCycle } from "~/entities/cycle";
import { useWorkspace } from "~/entities/startup";
import { useMinute } from "~/shared/lib/minute";
import { Button } from "~/shared/ui/button";
import { useSetOff } from "../api/useSetOff";
import { useStartWeek } from "../api/useStartWeek";

/** While the week is being planned: who has Cards, who is off, and Start the week. */
export function StartWeekBar() {
	const { startup, isFounder } = useWorkspace();
	const cycle = useCycle(startup._id);
	const team = useTeamPeople(startup._id);
	const cards = useBoardCards(useBoardScope());
	const startWeek = useStartWeek(startup._id);
	const setOff = useSetOff(startup._id);
	const now = useMinute();

	if (cycle?.state !== "planning" || !team || !cards) {
		return null;
	}

	const people = [team.founder, ...team.contributors].filter(
		(person) => person !== null,
	);
	const meetingOver =
		cycle.nextOpening !== null && now >= cycle.nextOpening.endsAt;

	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2 text-sm">
			<span className="text-muted-foreground">
				{meetingOver
					? "Add this week's Cards, then start the week."
					: "The Board opens after Monday's meeting."}
			</span>
			<ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
				{people.map((person) => {
					const isOff = cycle.offUserIds.includes(person._id);
					const count = cards.filter(
						(card) =>
							card.owner?._id === person._id &&
							(card.status === "todo" || card.status === "in_progress"),
					).length;
					return (
						<li key={person._id} className="flex items-center gap-1.5">
							<span className={isOff ? "text-muted-foreground" : undefined}>
								{person.name ?? "Someone"} · {isOff ? "off" : count}
							</span>
							{isFounder ? (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-1.5 text-xs"
									aria-pressed={isOff}
									onClick={() => void setOff(person._id, !isOff)}
								>
									{isOff ? "Back on" : "Off this week"}
								</Button>
							) : null}
						</li>
					);
				})}
			</ul>
			{isFounder ? (
				<Button
					size="sm"
					className="ml-auto"
					disabled={!meetingOver}
					onClick={() => void startWeek()}
				>
					Start the week
				</Button>
			) : null}
		</div>
	);
}
