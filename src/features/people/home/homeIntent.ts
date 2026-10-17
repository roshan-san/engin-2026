/** Where `/home?intent=post` should go once places have loaded; `null` means stay on Home. */
export function homeIntent(
	intent: "post" | undefined,
	places:
		| {
				readonly startups: readonly {
					readonly slug: string;
					readonly role: "founder" | "contributor";
				}[];
		  }
		| undefined,
):
	| { readonly to: "/onboarding" }
	| { readonly to: "/s/$slug/hiring/new"; readonly slug: string }
	| null {
	if (intent !== "post" || places === undefined) {
		return null;
	}
	const founded = places.startups.find((startup) => startup.role === "founder");
	return founded
		? { to: "/s/$slug/hiring/new", slug: founded.slug }
		: { to: "/onboarding" };
}
