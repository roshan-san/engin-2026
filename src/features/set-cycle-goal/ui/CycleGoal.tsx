import { useWorkspace } from "~/entities/startup";
import { GoalPrompt } from "./GoalPrompt";

/** This week's goal in the page itself, since a phone's bar has no room for it. There the Founder edits it here too. */
export function CycleGoal({ goal }: { readonly goal: string }) {
	const { isFounder } = useWorkspace();

	return (
		<>
			<p className={isFounder ? "hidden break-words md:block" : "break-words"}>
				{goal}
			</p>
			{isFounder ? (
				<div className="md:hidden">
					<GoalPrompt key={goal} current={goal} />
				</div>
			) : null}
		</>
	);
}
