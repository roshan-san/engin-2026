import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/**
 * Resolves a Startup by its URL slug and focuses it for Members whenever it
 * isn't already the Focused Startup (edge SHELL-02/idempotency). A Convex
 * query can't write, so focus is a separate mutation (research Pitfall 3).
 */
export function useStartupBySlug(slug: string) {
	const result = useQuery(api.teams.startups.getBySlug, { slug });
	const focus = useMutation(api.teams.startups.focus);

	useEffect(() => {
		if (!result || result.role === null || result.isFocused) {
			return;
		}

		focus({ startupId: result.startup._id }).catch((error: unknown) => {
			toast.error(toErrorMessage(error, "Could not open this Startup"));
		});
	}, [result, focus]);

	return { result, isLoading: result === undefined };
}
