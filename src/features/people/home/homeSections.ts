/** What Home shows: the two ways in until you have a Startup or a Hackathon you build in, and your applications whenever you have any. */
export function homeSections(places: {
	readonly startups: readonly unknown[];
	readonly hackathons: readonly unknown[];
	readonly applied: readonly unknown[];
}): { readonly welcome: boolean; readonly applications: boolean } {
	return {
		welcome: places.startups.length === 0 && places.hackathons.length === 0,
		applications: places.applied.length > 0,
	};
}
