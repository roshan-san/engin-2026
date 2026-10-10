import { useRef, useState } from "react";
import { MentorNote } from "~/components/shared/MentorNote";
import { Input } from "~/components/ui/input";
import { cycleDates } from "./cycleDates";
import { useCycle } from "./hooks/useCycle";
import { useSetGoal } from "./hooks/useSetGoal";
import { useWorkspace } from "./StartupContext";

/** "Cycle 3 · Oct 12 – 18 ·" and the week's goal; the Founder edits it in place. */
export function CycleHeader() {
	const { startup, isFounder } = useWorkspace();
	const cycle = useCycle(startup._id);
	const setGoal = useSetGoal(startup._id);
	const [draft, setDraft] = useState<string | null>(null);
	const [isFocused, setIsFocused] = useState(false);
	const isReverting = useRef(false);

	if (!cycle) {
		return <div className="h-9" />;
	}

	const goal = cycle.goal ?? "";
	const when = `Cycle ${cycle.number} · ${cycleDates(cycle.startsAt, cycle.endsAt)}`;

	async function save() {
		setIsFocused(false);
		if (draft === null) return;
		const next = draft.trim();
		if (next !== goal) await setGoal(next);
		setDraft(null);
	}

	if (!isFounder) {
		return (
			<p className="flex h-9 min-w-0 items-center text-sm text-muted-foreground">
				<span className="truncate">
					{when}
					{goal ? (
						<>
							{" · "}
							<span className="text-foreground">{goal}</span>
						</>
					) : null}
				</span>
			</p>
		);
	}

	return (
		<div className="min-w-0 flex-1">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<span className="shrink-0">{when} ·</span>
				<Input
					aria-label="Cycle goal"
					placeholder="Set this week's goal"
					value={draft ?? goal}
					maxLength={140}
					autoComplete="off"
					className="max-w-md flex-1"
					onFocus={() => {
						setIsFocused(true);
						setDraft(goal);
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
			</div>
			{isFocused ? (
				<div className="mt-1">
					<MentorNote>One line. What makes this week count?</MentorNote>
				</div>
			) : null}
		</div>
	);
}
