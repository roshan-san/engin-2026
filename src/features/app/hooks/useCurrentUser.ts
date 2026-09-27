import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

export function useCurrentUser() {
	const user = useQuery(api.people.users.getMe);

	return {
		user,
		isLoading: user === undefined,
	};
}
