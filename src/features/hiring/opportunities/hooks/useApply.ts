import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { toErrorMessage } from "~/lib/validation";

/**
 * Sends one application. A refusal comes back as the backend's own words,
 * shown where the contributor applied; the UI never decides who may enter.
 */
export function useApply(trialCycleId: Id<"trialCycles">) {
	const applyToTrial = useMutation(api.hiring.applications.applyToTrial);
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);
	// State lands a render late; the ref stops a double click sending twice.
	const pendingRef = useRef(false);

	async function apply(message: string): Promise<boolean> {
		if (pendingRef.current) {
			return false;
		}
		pendingRef.current = true;
		setIsPending(true);
		setError(null);
		try {
			await applyToTrial({
				trialCycleId,
				message: message.trim() || undefined,
				acceptTerms: true,
			});
			return true;
		} catch (caught) {
			setError(toErrorMessage(caught, "Could not apply"));
			return false;
		} finally {
			pendingRef.current = false;
			setIsPending(false);
		}
	}

	return { apply, error, isPending, reset: () => setError(null) };
}
