import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { LAST_PLACE_KEY } from "~/shell/places/landing";
import { currentPlace } from "~/shell/places/places";

/** Remembers the last Startup or Hackathon Board you were in, for the next landing. */
export function useRememberPlace() {
	const pathname = useLocation({ select: (location) => location.pathname });

	useEffect(() => {
		if (currentPlace(pathname)) {
			localStorage.setItem(LAST_PLACE_KEY, pathname);
		}
	}, [pathname]);
}
