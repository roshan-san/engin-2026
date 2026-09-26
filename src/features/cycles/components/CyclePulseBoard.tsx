import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PULSE_STATUSES, type PulseStatus } from "~/features/pulses/constants";
import { cn } from "~/lib/utils";
import { toErrorMessage } from "~/lib/validation";

type CyclePulseBoardProps = {
	readonly startupId: Id<"startups">;
	readonly cycleId: Id<"cycles">;
	readonly canCreate: boolean;
};

export function CyclePulseBoard({
	startupId,
	cycleId,
	canCreate,
}: CyclePulseBoardProps) {
	const pulses = useQuery(api.pulses.listForCycle, { cycleId });
	const createPulse = useMutation(api.pulses.create);
	const setStatus = useMutation(api.pulses.setStatus);
	const assignToMe = useMutation(api.pulses.assignToMe);
	const [title, setTitle] = useState("");
	const [pendingId, setPendingId] = useState<string | null>(null);

	async function create() {
		if (!title.trim()) {
			return;
		}
		try {
			await createPulse({
				startupId,
				title: title.trim(),
				cycleId,
			});
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
						placeholder="Add a Pulse to this Cycle"
						className="h-11 flex-1"
					/>
					<Button type="submit" disabled={!title.trim()} className="h-11">
						Add Pulse
					</Button>
				</form>
			) : null}

			{pulses === undefined ? (
				<p className="text-sm text-muted-foreground">Loading Pulses…</p>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
					{PULSE_STATUSES.map((column) => {
						const items = pulses.filter(
							(pulse) => pulse.status === column.value,
						);
						return (
							<div
								key={column.value}
								className="rounded-xl border border-border bg-card/40 p-3"
							>
								<div className="mb-3 flex items-center justify-between gap-2">
									<h2 className="text-sm font-medium">{column.label}</h2>
									<span className="text-xs tabular-nums text-muted-foreground">
										{items.length}
									</span>
								</div>
								<ul className="space-y-2">
									{items.map((pulse) => (
										<li
											key={pulse._id}
											className="rounded-lg border border-border bg-background p-3"
										>
											<p className="font-medium leading-snug">{pulse.title}</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{pulse.assignee?.name ??
													pulse.assignee?.username ??
													"Unassigned"}
											</p>
											<div className="mt-3 flex items-center justify-between gap-2">
												<fieldset
													className="flex gap-1.5 border-0 p-0"
													aria-label="Pulse status"
												>
													{PULSE_STATUSES.map((status) => (
														<button
															key={status.value}
															type="button"
															disabled={pendingId === pulse._id}
															aria-label={status.label}
															aria-pressed={pulse.status === status.value}
															className={cn(
																"size-2.5 rounded-full",
																pulse.status === status.value
																	? "bg-foreground"
																	: "bg-muted hover:bg-muted-foreground/50",
															)}
															onClick={() =>
																void run(pulse._id, () =>
																	setStatus({
																		pulseId: pulse._id,
																		status: status.value as PulseStatus,
																	}),
																)
															}
														/>
													))}
												</fieldset>
												{!pulse.assignee ? (
													<Button
														type="button"
														size="sm"
														variant="ghost"
														className="h-7 px-2 text-xs"
														disabled={pendingId === pulse._id}
														onClick={() =>
															void run(pulse._id, () =>
																assignToMe({ pulseId: pulse._id }),
															)
														}
													>
														Take
													</Button>
												) : null}
											</div>
										</li>
									))}
								</ul>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
