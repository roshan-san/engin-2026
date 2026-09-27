import type { Id } from "@convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useCycleForm } from "~/features/work/cycles/hooks/useCycleForm";

type StartCycleFormProps = {
	readonly startupId: Id<"startups">;
};

export function StartCycleForm({ startupId }: StartCycleFormProps) {
	const {
		title,
		setTitle,
		startAt,
		setStartAt,
		endAt,
		setEndAt,
		isPending,
		create,
	} = useCycleForm(startupId);

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
