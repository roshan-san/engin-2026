import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { fromDateInput } from "~/lib/dates";
import { toErrorMessage } from "~/lib/validation";

type StartCycleFormProps = {
	readonly startupId: Id<"startups">;
};

export function StartCycleForm({ startupId }: StartCycleFormProps) {
	const createCycle = useMutation(api.cycles.create);
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

	return (
		<form
			className="space-y-3 rounded-xl border border-border p-4"
			onSubmit={(event) => {
				event.preventDefault();
				void create();
			}}
		>
			<p className="font-medium">Open the next Cycle</p>
			<Input
				required
				value={title}
				onChange={(event) => setTitle(event.target.value)}
				placeholder="Cycle 12"
				className="h-11"
			/>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<Input
					required
					type="date"
					value={startAt}
					onChange={(event) => setStartAt(event.target.value)}
					className="h-11"
				/>
				<Input
					required
					type="date"
					value={endAt}
					onChange={(event) => setEndAt(event.target.value)}
					className="h-11"
				/>
			</div>
			<Button
				type="submit"
				disabled={isPending}
				className="h-11 w-full sm:w-auto"
			>
				Create Cycle
			</Button>
		</form>
	);
}
