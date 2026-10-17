import { TEXT } from "@convex/shared/limits";
import { useRef, useState } from "react";
import { MentorNote } from "~/components/MentorNote";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { cycleDates } from "./cycleDates";
import { useWorkspace } from "./StartupContext";
import { useCycle } from "./useCycle";
import { useSetGoal } from "./useSetGoal";

/** "Cycle 3 · Oct 12 – 18", then the week's goal; the Founder edits it in place. */
export function CycleHeader() {
	const { startup, isFounder } = useWorkspace();
	const cycle = useCycle(startup._id);
	const setGoal = useSetGoal(startup._id);
	const [draft, setDraft] = useState<string | null>(null);
	const [isFocused, setIsFocused] = useState(false);
	const isReverting = useRef(false);

	if (!cycle) {
		return (
			<div className="flex min-w-0 flex-1 items-center">
				<Skeleton className="h-4 w-16" />
			</div>
		);
	}

	const goal = cycle.goal ?? "";
	const when = (
		<span className="shrink-0 text-sm text-muted-foreground">
			Cycle {cycle.number}
			<span className="hidden sm:inline">
				{" · "}
				{cycleDates(cycle.startsAt, cycle.endsAt)}
			</span>
		</span>
	);
	const divider = <span aria-hidden className="h-4 w-px shrink-0 bg-border" />;

	async function save() {
		setIsFocused(false);
		if (draft === null) return;
		const next = draft.trim();
		// A failed save keeps what was typed; the toast says why.
		if (next === goal || (await setGoal(next))) setDraft(null);
	}

	if (!isFounder) {
		return (
			<div className="flex min-w-0 flex-1 items-center gap-3">
				{when}
				{goal ? (
					<>
						{divider}
						<p className="truncate text-sm">{goal}</p>
					</>
				) : null}
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-1 items-center gap-3">
			{when}
			{divider}
			<div className="relative -ml-2 min-w-0 max-w-xl flex-1">
				<Input
					aria-label="Cycle goal"
					placeholder="Set this week's goal"
					value={draft ?? goal}
					maxLength={TEXT.goal}
					autoComplete="off"
					className="h-8 truncate border-transparent bg-transparent px-2 hover:border-transparent hover:bg-accent/50 focus-visible:border-input focus-visible:bg-background"
					onFocus={() => {
						setIsFocused(true);
						setDraft((current) => current ?? goal);
					}}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.currentTarget.blur();
						} else if (event.key === "Escape") {
							isReverting.current = true;
							setDraft(null);
							event.currentTarget.blur();
						}
					}}
					onBlur={() => {
						if (isReverting.current) {
							isReverting.current = false;
							setIsFocused(false);
							return;
						}
						void save();
					}}
				/>
				{isFocused ? (
					// Below the bar, over the Board's top edge, so the bar keeps its height.
					<div className="absolute top-full left-2 z-10 mt-2 rounded-md bg-background px-1">
						<MentorNote>
							What has to ship by Sunday? Keep it to one line.
						</MentorNote>
					</div>
				) : null}
			</div>
		</div>
	);
}
