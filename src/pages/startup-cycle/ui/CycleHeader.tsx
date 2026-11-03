import { useState } from "react";
import { useCycle } from "~/entities/cycle";
import { useWorkspace } from "~/entities/startup";
import { MeetingsDialog } from "~/features/set-meetings";
import { dateRange } from "~/shared/lib/dates";
import { Button } from "~/shared/ui/button";
import { Skeleton } from "~/shared/ui/skeleton";
import { meetingLabel } from "../model/meetingLabel";

/** "Cycle 3 · Oct 12 – 18", then where the week stands: the next meeting, or the lock. */
export function CycleHeader() {
	const { startup, isFounder } = useWorkspace();
	const cycle = useCycle(startup._id);
	const [isEditing, setIsEditing] = useState(false);

	if (!cycle) {
		return (
			<div className="flex min-w-0 flex-1 items-center">
				<Skeleton className="h-4 w-16" />
			</div>
		);
	}

	const { meetings, state } = cycle;
	const status = !meetings
		? null
		: state === "closing"
			? { text: "Closing meeting now", link: meetings.closingLink }
			: state === "planning"
				? {
						text: `Locked · ${meetingLabel("Opening", meetings.opening, "Mon")}`,
						link: meetings.openingLink,
					}
				: {
						text: meetingLabel("Closing", meetings.closing, "Fri"),
						link: meetings.closingLink,
					};

	return (
		<div className="flex min-w-0 flex-1 items-center gap-3">
			<span className="shrink-0 text-sm text-muted-foreground">
				Cycle {cycle.number}
				<span className="hidden sm:inline">
					{" · "}
					{dateRange(cycle.startsAt, cycle.endsAt)}
				</span>
			</span>
			{status ? (
				<>
					<span
						aria-hidden
						className="hidden h-4 w-px shrink-0 bg-border md:block"
					/>
					<span className="hidden truncate text-sm md:inline">
						{status.text}
					</span>
					{status.link ? (
						<a
							href={status.link}
							target="_blank"
							rel="noreferrer"
							className="shrink-0 text-sm text-primary underline underline-offset-4"
						>
							Join
						</a>
					) : null}
				</>
			) : null}
			{isFounder && !cycle.isSolo ? (
				<>
					<Button
						variant="ghost"
						size="sm"
						className="shrink-0"
						onClick={() => setIsEditing(true)}
					>
						Meetings
					</Button>
					<MeetingsDialog open={isEditing} onOpenChange={setIsEditing} />
				</>
			) : null}
		</div>
	);
}
