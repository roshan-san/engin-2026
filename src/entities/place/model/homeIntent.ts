/** Where to send someone who wants to post a Hackathon, through sign-in if they need it. */
export const POST_INTENT_PATH = "/home?intent=post";

/** Where to send someone who wants to get going, through sign-in if they need it. */
export const START_INTENT_PATH = "/home?intent=start";

/** Where `/home?intent=…` should go once places have loaded; `null` means stay on Home. */
export function homeIntent(
	intent: "post" | "start" | undefined,
	places:
		| {
				readonly startups: readonly {
					readonly slug: string;
					readonly role: "founder" | "contributor";
				}[];
		  }
		| undefined,
):
	| {
			readonly to: "/onboarding";
			readonly search: { readonly intent?: "post" };
	  }
	| {
			readonly to: "/s/$slug/hiring/new" | "/s/$slug/cycle";
			readonly slug: string;
	  }
	| null {
	if (intent === undefined || places === undefined) {
		return null;
	}
	const founded = places.startups.find((startup) => startup.role === "founder");
	if (intent === "post") {
		return founded
			? { to: "/s/$slug/hiring/new", slug: founded.slug }
			: { to: "/onboarding", search: { intent: "post" } };
	}
	return founded
		? { to: "/s/$slug/cycle", slug: founded.slug }
		: { to: "/onboarding", search: {} };
}
