import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PulseProofLinks } from "~/features/work/pulses/components/PulseProofLinks";
import {
	type PulseStatus,
	WORKABLE_PULSE_STATUSES,
} from "~/features/work/pulses/constants";
import { toErrorMessage } from "~/lib/validation";

type PulseBoardProps = {
	readonly startupId: Id<"startups">;
	readonly trialCycleId: Id<"trialCycles">;
	/** A Board can only be changed while its Trial Cycle is active. */
	readonly isEditable: boolean;
};

/** A Participant's own Board: they add, edit, move and delete its Pulses. */
export function PulseBoard({
	startupId,
	trialCycleId,
	isEditable,
}: PulseBoardProps) {
	const pulses = useQuery(api.work.pulses.listBoard, { trialCycleId });
	const createPulse = useMutation(api.work.pulses.create);
	const updatePulse = useMutation(api.work.pulses.update);
	const setStatus = useMutation(api.work.pulses.setStatus);
	const removePulse = useMutation(api.work.pulses.remove);
	const [title, setTitle] = useState("");
	const [pendingId, setPendingId] = useState<string | null>(null);

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

	async function create() {
		if (!title.trim()) {
			return;
		}
		await run("new", async () => {
			await createPulse({ startupId, title: title.trim(), trialCycleId });
			setTitle("");
		});
	}

	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">Your Board</h2>
			{isEditable ? (
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
						placeholder="Break the work down: add a Pulse"
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
					title="Nothing on your Board yet"
					description="The Challenges from the Founders appear here when the Trial Cycle starts. Split them into Pulses as you go."
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
								{pulse.description ? (
									<p className="text-sm text-muted-foreground">
										{pulse.description}
									</p>
								) : null}
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<PulseProofLinks
									pulseId={pulse._id}
									proofLinks={pulse.proofLinks}
									canEdit={isEditable}
									isPending={pendingId === pulse._id}
									run={(action) => void run(pulse._id, action)}
								/>
								<select
									value={pulse.status}
									disabled={!isEditable || pendingId === pulse._id}
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
								{isEditable ? (
									<>
										<Button
											type="button"
											size="sm"
											variant="outline"
											disabled={pendingId === pulse._id}
											onClick={() => {
												const next = window.prompt("Rename Pulse", pulse.title);
												if (next?.trim()) {
													void run(pulse._id, () =>
														updatePulse({ pulseId: pulse._id, title: next }),
													);
												}
											}}
										>
											Rename
										</Button>
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
									</>
								) : null}
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
