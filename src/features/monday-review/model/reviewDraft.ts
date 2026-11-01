export type ReviewDraft = {
	readonly goalMet: boolean | null;
	readonly dropped: ReadonlySet<string>;
	/** `null` until typed in, so the sheet shows the goal as it is now. */
	readonly nextGoal: string | null;
};

/** A week with a goal needs its answer first. */
export function canCloseReview(draft: ReviewDraft, hasGoal: boolean): boolean {
	return !hasGoal || draft.goalMet !== null;
}

/** The answers as `cycles.closeReview` arguments; a blank or unchanged goal isn't sent. */
export function toCloseArgs(
	draft: ReviewDraft,
	review: { readonly week: string; readonly currentGoal: string | null },
) {
	const nextGoal = draft.nextGoal?.trim();
	return {
		week: review.week,
		...(draft.goalMet === null ? {} : { goalMet: draft.goalMet }),
		dropCardIds: [...draft.dropped],
		...(nextGoal && nextGoal !== review.currentGoal ? { nextGoal } : {}),
	};
}
