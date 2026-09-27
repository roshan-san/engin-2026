import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PulseProofLinks } from "~/features/work/pulses/components/PulseProofLinks";
import { PulseReviewControls } from "~/features/work/pulses/components/PulseReviewControls";
import {
	type PulseStatus,
	WORKABLE_PULSE_STATUSES,
} from "~/features/work/pulses/constants";
import { toErrorMessage } from "~/lib/validation";

type PulseBoardProps = {
	readonly startupId: Id<"startups">;
	readonly trialCycleId: Id<"trialCycles">;
	readonly canCreate: boolean;
};

export function PulseBoard({
	startupId,
	trialCycleId,
	canCreate,
}: PulseBoardProps) {
	const pulses = useQuery(api.work.pulses.listForTrial, { trialCycleId });
	const createPulse = useMutation(api.work.pulses.create);
	const setStatus = useMutation(api.work.pulses.setStatus);
	const assignToMe = useMutation(api.work.pulses.assignToMe);
	const removePulse = useMutation(api.work.pulses.remove);
	const [title, setTitle] = useState("");
	const [pendingId, setPendingId] = useState<string | null>(null);

	async function create() {
		if (!title.trim()) {
			return;
		}
		try {
			await createPulse({ startupId, title: title.trim(), trialCycleId });
			setTitle("");
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not create Pulse"));
		}
	}

	async function run(id: string, action: () => Promise<unknown>) {
		setPendingId(id);
		try {
			await action();
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update Pulse"));
		} finally {
			setPendingId(null);
		}
	}

	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">Pulses</h2>
			{canCreate ? (
				<form
					className="flex flex-col gap-2 sm:flex-row"
					onSubmit={(event) => {
						event.preventDefault();
						void create();
					}}
				>
					<Input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="What needs to get done?"
						className="h-11 flex-1"
					/>
					<Button type="submit" disabled={!title.trim()} className="h-11">
						Add Pulse
					</Button>
				</form>
			) : null}
			{pulses === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : pulses.length === 0 ? (
				<EmptyState
					title="No Pulses yet"
					description="Create a Pulse with just a title. Everything else is optional."
				/>
			) : (
				<ul className="space-y-2">
					{pulses.map((pulse) => (
						<li
							key={pulse._id}
							className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center"
						>
							<div className="min-w-0 flex-1">
								<p className="font-medium">{pulse.title}</p>
								<p className="text-sm text-muted-foreground">
									{pulse.assignee?.name ??
										pulse.assignee?.username ??
										"Unassigned"}
								</p>
								{pulse.reviewNote && pulse.status === "in_progress" ? (
									<p className="mt-1 text-sm text-destructive">
										Sent back: {pulse.reviewNote}
									</p>
								) : null}
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<PulseProofLinks
									pulseId={pulse._id}
									proofLinks={pulse.proofLinks}
									canEdit={pulse.status !== "review" && pulse.status !== "done"}
									isPending={pendingId === pulse._id}
									run={(action) => void run(pulse._id, action)}
								/>
								{pulse.status === "review" ? (
									<PulseReviewControls
										pulseId={pulse._id}
										canReview={canCreate}
										isPending={pendingId === pulse._id}
										run={(action) => void run(pulse._id, action)}
									/>
								) : (
									<select
										value={pulse.status}
										disabled={pendingId === pulse._id}
										onChange={(event) =>
											void run(pulse._id, () =>
												setStatus({
													pulseId: pulse._id,
													status: event.target.value as PulseStatus,
												}),
											)
										}
										className="border-input h-8 rounded-md border bg-transparent px-2 text-sm"
									>
										{WORKABLE_PULSE_STATUSES.map((status) => (
											<option key={status.value} value={status.value}>
												{status.label}
											</option>
										))}
									</select>
								)}
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={pendingId === pulse._id}
									onClick={() =>
										void run(pulse._id, () =>
											assignToMe({ pulseId: pulse._id }),
										)
									}
								>
									Assign me
								</Button>
								{canCreate ? (
									<Button
										type="button"
										size="sm"
										variant="ghost"
										disabled={pendingId === pulse._id}
										onClick={() =>
											void run(pulse._id, () =>
												removePulse({ pulseId: pulse._id }),
											)
										}
									>
										Delete
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
