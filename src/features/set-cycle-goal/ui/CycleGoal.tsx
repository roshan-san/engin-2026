import { useWorkspace } from "~/entities/startup";
import { GoalPrompt } from "./GoalPrompt";

/** This week's goal above a phone's Board, since its bar has no room. The Founder edits it here too. */
export function CycleGoal({ goal }: { readonly goal: string }) {
	const { isFounder } = useWorkspace();

	return (
		<div className="shrink-0 px-3 pt-3 md:hidden">
			{isFounder ? (
				<GoalPrompt key={goal} current={goal} />
			) : (
				<p className="text-sm break-words">{goal}</p>
			)}
		</div>
	);
}
