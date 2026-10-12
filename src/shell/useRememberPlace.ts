import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { writeLastPlace } from "~/shell/landing";
import { currentPlace } from "~/shell/places";

/** Remembers the last Startup or Hackathon Board you were in, for the next landing. */
export function useRememberPlace() {
	const pathname = useLocation({ select: (location) => location.pathname });

	useEffect(() => {
		if (currentPlace(pathname)) {
			writeLastPlace(pathname);
		}
	}, [pathname]);
}
