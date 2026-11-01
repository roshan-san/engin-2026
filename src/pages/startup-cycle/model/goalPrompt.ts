export type CycleView = "list" | "board";

/** The Founder's goal prompt: above the List until a goal is set, and in place of an empty Board. */
export function showsGoalPrompt({
	isFounder,
	goal,
	cardCount,
	view,
}: {
	readonly isFounder: boolean;
	readonly goal: string | null;
	readonly cardCount: number;
	readonly view: CycleView;
}): boolean {
	if (!isFounder || goal !== null) return false;
	return view === "list" || cardCount === 0;
}
