/** The deep-page crumb in the top bar (one Cycle, one hackathon). */
export type Crumb = {
	readonly owner: number;
	readonly label: string;
	readonly href: string;
};

export type CrumbAction =
	| { readonly type: "set"; readonly crumb: Crumb }
	| { readonly type: "unset"; readonly owner: number };

/**
 * Only the page that set the crumb can clear it, so a page unmounting after
 * the next page mounted doesn't wipe the newer crumb.
 */
export function crumbReducer(
	state: Crumb | null,
	action: CrumbAction,
): Crumb | null {
	if (action.type === "set") return action.crumb;
	return state?.owner === action.owner ? null : state;
}
