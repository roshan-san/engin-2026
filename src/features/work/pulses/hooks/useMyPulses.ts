import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type MyPulse = FunctionReturnType<
	typeof api.work.pulses.listMine
>[number];
export type PulseToReview = FunctionReturnType<
	typeof api.work.pulses.listToReview
>[number];

/** The viewer's Pulses across Startups, grouped by where they stand, and a Founder's review queue. */
export function useMyPulses() {
	const pulses = useQuery(api.work.pulses.listMine);
	const toReview = useQuery(api.work.pulses.listToReview);

	return {
		pulses,
		toReview,
		open:
			pulses?.filter(
				(pulse) => pulse.status === "todo" || pulse.status === "in_progress",
			) ?? [],
		inReview: pulses?.filter((pulse) => pulse.status === "review") ?? [],
		done: pulses?.filter((pulse) => pulse.status === "done") ?? [],
	};
}
