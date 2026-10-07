import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { fromDateInput } from "~/lib/dates";
import { toErrorMessage } from "~/lib/validation";

/** The Startup's Cycles the viewer belongs to, newest first. */
export function useCycles(startupId: Id<"startups"> | undefined) {
	const cycles = useQuery(
		api.work.cycles.list,
		startupId ? { startupId } : "skip",
	);
	return { cycles };
}

export type NewCycle = {
	title: string;
	goal: string;
	startAt: string;
	endAt: string;
};

/** Creates a planned Cycle from date-input values; resolves to its id or null. */
export function useCreateCycle(startupId: Id<"startups"> | undefined) {
	const createCycle = useMutation(api.work.cycles.create);
	const [isPending, setIsPending] = useState(false);

	async function create(input: NewCycle): Promise<Id<"cycles"> | null> {
		if (!startupId) {
			return null;
		}
		setIsPending(true);
		try {
			return await createCycle({
				startupId,
				title: input.title,
				goal: input.goal,
				startAt: fromDateInput(input.startAt),
				endAt: fromDateInput(input.endAt),
			});
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not create Cycle"));
			return null;
		} finally {
			setIsPending(false);
		}
	}

	return { create, isPending };
}
