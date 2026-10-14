import { useMatches } from "@tanstack/react-router";
import { useEffect } from "react";
import { rememberedFrom, writeLastPlace } from "~/shell/landing";

/** Remembers the last Startup or Hackathon Board you were in, for the next landing. */
export function useRememberPlace() {
	// A string, so the effect runs when the page changes, not on every new object.
	const remembered = useMatches({
		select: (matches) => JSON.stringify(rememberedFrom(matches)),
	});

	useEffect(() => {
		const parsed = JSON.parse(remembered);
		if (parsed) writeLastPlace(parsed);
	}, [remembered]);
}
