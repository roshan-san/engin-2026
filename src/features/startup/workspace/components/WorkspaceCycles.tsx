import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { EmptyState } from "~/components/shared/EmptyState";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useCycleForm } from "~/features/cycles/hooks/useCycleForm";
import { formatDate } from "~/lib/dates";

type WorkspaceCyclesProps = {
	readonly startupId: Id<"startups">;
	readonly isFounder: boolean;
};

export function WorkspaceCycles({
	startupId,
	isFounder,
}: WorkspaceCyclesProps) {
	const cycles = useQuery(api.cycles.list, { startupId });
	const startCycle = useMutation(api.cycles.start);
	const closeCycle = useMutation(api.cycles.close);
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
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">Cycles</h2>
			{isFounder ? (
				<form
					className="grid grid-cols-1 gap-2 md:grid-cols-4"
					onSubmit={(event) => {
						event.preventDefault();
						void create();
					}}
				>
					<Input
						required
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Cycle title"
						className="h-11 md:col-span-1"
					/>
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
					<Button type="submit" disabled={isPending} className="h-11">
						Create Cycle
					</Button>
				</form>
			) : null}
			{cycles === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : cycles.length === 0 ? (
				<EmptyState
					title="No Cycles"
					description="Cycles group internal Pulses for a set period."
				/>
			) : (
				<ul className="space-y-2">
					{cycles.map((cycle) => (
						<li
							key={cycle._id}
							className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
						>
							<div className="min-w-0 flex-1">
								<p className="font-medium">{cycle.title}</p>
								<p className="text-sm text-muted-foreground">
									{formatDate(cycle.startAt)} – {formatDate(cycle.endAt)}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="secondary">{cycle.status}</Badge>
								{isFounder && cycle.status !== "active" ? (
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => void startCycle({ cycleId: cycle._id })}
									>
										Start
									</Button>
								) : null}
								{isFounder && cycle.status !== "closed" ? (
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => void closeCycle({ cycleId: cycle._id })}
									>
										Close
									</Button>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
