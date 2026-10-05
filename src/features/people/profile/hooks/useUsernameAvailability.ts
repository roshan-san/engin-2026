import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Whether a typed username is free; undefined while unchecked or unchanged. */
export function useUsernameAvailability(
	value: string,
	savedUsername: string | null,
) {
	const username = value.trim().toLowerCase();
	const shouldCheck = username !== "" && username !== savedUsername;
	const available = useQuery(
		api.people.users.usernameAvailable,
		shouldCheck ? { username } : "skip",
	);

	return { available: shouldCheck ? available : undefined };
}
