/** The Founder's goal prompt, in place of an empty Board. */
export function showsGoalPrompt({
	isFounder,
	goal,
	cardCount,
}: {
	readonly isFounder: boolean;
	readonly goal: string | null;
	readonly cardCount: number;
}): boolean {
	return isFounder && goal === null && cardCount === 0;
}
