import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

export function useFollowStartup(startupId: Id<"startups"> | undefined) {
	const toggleFollow = useMutation(api.teams.follows.toggle);
	const [isPending, setIsPending] = useState(false);

	async function toggle() {
		if (!startupId) {
			return;
		}

		setIsPending(true);
		try {
			const result = await toggleFollow({ startupId });
			toast.success(result.following ? "Following" : "Unfollowed");
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update follow"));
		} finally {
			setIsPending(false);
		}
	}

	return { toggle, isPending };
}
