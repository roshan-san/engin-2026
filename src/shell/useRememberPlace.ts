import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { writeLastPlace } from "~/shell/landing";
import { useCurrentPlace } from "~/shell/useCurrentPlace";

/** Remembers the last Startup or Hackathon Board you were in, for the next landing. */
export function useRememberPlace() {
	const place = useCurrentPlace();
	const path = useLocation({ select: (location) => location.pathname });

	useEffect(() => {
		if (place) {
			writeLastPlace({ place, path });
		}
	}, [place, path]);
}
