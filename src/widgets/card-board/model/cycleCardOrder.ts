const RANK = { in_progress: 0, review: 1, todo: 2, done: 3 } as const;

/** The List's order: what's moving, what's waiting on Approve, what's next, what's done. */
export function cycleCardOrder<
	T extends { readonly status: keyof typeof RANK },
>(cards: readonly T[]): T[] {
	return [...cards].sort((a, b) => RANK[a.status] - RANK[b.status]);
}
