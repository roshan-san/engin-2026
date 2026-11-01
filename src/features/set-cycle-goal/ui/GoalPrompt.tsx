import { CYCLE_TEXT } from "@convex/cycles/rules";
import { type FormEvent, useState } from "react";
import { useWorkspace } from "~/entities/startup";
import { GOAL_QUESTION } from "~/shared/config/goalQuestion";
import { Button } from "~/shared/ui/button";
import { Input } from "~/shared/ui/input";
import { MentorNote } from "~/shared/ui/MentorNote";
import { useSetGoal } from "../api/useSetGoal";
import { goalToSave } from "../model/goalDraft";

/** Asks for this week's goal, in place of an empty Board. */
export function GoalPrompt() {
	const { startup } = useWorkspace();
	const setGoal = useSetGoal(startup._id);
	const [draft, setDraft] = useState("");

	function submit(event: FormEvent) {
		event.preventDefault();
		const goal = goalToSave(draft, null);
		if (goal) void setGoal(goal);
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-2">
			<label htmlFor="cycle-goal" className="text-lg font-semibold">
				{GOAL_QUESTION}
			</label>
			<div className="flex gap-2">
				<Input
					id="cycle-goal"
					value={draft}
					maxLength={CYCLE_TEXT.goal}
					autoComplete="off"
					onChange={(event) => setDraft(event.target.value)}
				/>
				<Button type="submit" disabled={goalToSave(draft, null) === null}>
					Set goal
				</Button>
			</div>
			<MentorNote>Keep it to one line.</MentorNote>
		</form>
	);
}
