import { CYCLE_TEXT } from "@convex/cycles/rules";
import { useState } from "react";
import { useWorkspace } from "~/entities/startup";
import { GOAL_QUESTION } from "~/shared/config/goalQuestion";
import { Button } from "~/shared/ui/button";
import { Textarea } from "~/shared/ui/textarea";
import { useSetGoal } from "../api/useSetGoal";
import { goalToSave } from "../model/goalDraft";

/** This week's goal above a phone's Board, since its bar has no room. The Founder sets and edits it here. */
export function CycleGoal({ goal }: { readonly goal: string | null }) {
	const { isFounder } = useWorkspace();

	if (isFounder) {
		return <FounderGoal key={goal} goal={goal} />;
	}
	return goal ? (
		<p className="shrink-0 px-3 pt-3 text-sm break-words md:hidden">{goal}</p>
	) : null;
}

function FounderGoal({ goal }: { readonly goal: string | null }) {
	const { startup } = useWorkspace();
	const setGoal = useSetGoal(startup._id);
	const [draft, setDraft] = useState(goal ?? "");
	const next = goalToSave(draft, goal);

	function save() {
		if (next) void setGoal(next);
	}

	return (
		<div className="flex shrink-0 items-start gap-2 px-3 pt-3 md:hidden">
			<Textarea
				rows={1}
				aria-label="Cycle goal"
				placeholder={GOAL_QUESTION}
				value={draft}
				maxLength={CYCLE_TEXT.goal}
				autoComplete="off"
				className="min-h-9 resize-none [field-sizing:content]"
				onChange={(event) =>
					setDraft(event.target.value.replace(/\s*\n\s*/g, " "))
				}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						save();
					}
				}}
			/>
			{next ? (
				<Button size="sm" onClick={save}>
					Save
				</Button>
			) : null}
		</div>
	);
}
