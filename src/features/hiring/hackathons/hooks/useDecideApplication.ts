import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

type Decision = "accepted" | "rejected";

/** Accepts or rejects one application at a time; a refusal shows the backend's words. */
export function useDecideApplication() {
	const decideApplication = useMutation(api.hiring.applications.decide);
	const [pendingId, setPendingId] = useState<Id<"applications"> | null>(null);

	async function decide(applicationId: Id<"applications">, status: Decision) {
		if (pendingId) {
			return;
		}
		setPendingId(applicationId);
		try {
			await decideApplication({ applicationId, status });
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update application"));
		} finally {
			setPendingId(null);
		}
	}

	return { decide, pendingId };
}
