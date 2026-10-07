import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/**
 * Exits a hackathon: before the start it's a free withdrawal, while it runs
 * it's Leaving. The backend decides which; a refusal shows its words.
 */
export function useLeaveHackathon() {
	const leaveHackathon = useMutation(api.hiring.applications.leaveHackathon);
	const [isPending, setIsPending] = useState(false);

	async function leave(
		hackathonId: Id<"hackathons">,
		isLeaving = false,
	): Promise<boolean> {
		if (isPending) {
			return false;
		}
		setIsPending(true);
		try {
			await leaveHackathon({ hackathonId });
			toast.success(
				isLeaving ? "You left the hackathon" : "Application withdrawn",
			);
			return true;
		} catch (error) {
			toast.error(
				toErrorMessage(
					error,
					isLeaving ? "Could not leave" : "Could not withdraw",
				),
			);
			return false;
		} finally {
			setIsPending(false);
		}
	}

	return { leave, isPending };
}
