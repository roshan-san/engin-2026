import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";

export function useContributors() {
	const [skill, setSkill] = useState("");
	const [location, setLocation] = useState("");
	const contributors = useQuery(api.teams.explore.contributors, {
		skill: skill || undefined,
		location: location || undefined,
	});

	return {
		skill,
		setSkill,
		location,
		setLocation,
		contributors,
	};
}
