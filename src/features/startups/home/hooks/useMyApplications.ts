import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Your applications to Hackathons, with each one's status. */
export function useMyApplications() {
	return useQuery(api.hiring.applications.listMine, {});
}
