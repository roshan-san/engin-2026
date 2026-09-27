import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { fromDateInput } from "~/lib/dates";
import { toErrorMessage } from "~/lib/validation";

/** Cycle-create form state and submit, shared by every place that opens a Cycle. */
export function useCycleForm(startupId: Id<"startups">) {
	const createCycle = useMutation(api.work.cycles.create);
	const [title, setTitle] = useState("");
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");
	const [isPending, setIsPending] = useState(false);

	async function create() {
		setIsPending(true);
		try {
			await createCycle({
				startupId,
				title,
				startAt: fromDateInput(startAt),
				endAt: fromDateInput(endAt),
			});
			setTitle("");
			setStartAt("");
			setEndAt("");
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not create Cycle"));
		} finally {
			setIsPending(false);
		}
	}

	return {
		title,
		setTitle,
		startAt,
		setStartAt,
		endAt,
		setEndAt,
		isPending,
		create,
	};
}
