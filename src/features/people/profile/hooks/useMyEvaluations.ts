import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** The signed-in user's entries that carry a founder's evaluation, newest first. */
export function useMyEvaluations() {
	const applications = useQuery(api.hiring.applications.listMine);

	return {
		evaluations: applications?.flatMap((application) =>
			application.evaluation
				? [{ ...application, evaluation: application.evaluation }]
				: [],
		),
	};
}
