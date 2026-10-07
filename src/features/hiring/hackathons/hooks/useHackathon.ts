import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useHackathon(hackathonId: string) {
	const hackathon = useQuery(api.hiring.hackathons.get, {
		hackathonId: hackathonId as Id<"hackathons">,
	});

	return { hackathon, isLoading: hackathon === undefined };
}
