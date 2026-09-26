import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { VERDICTS, type Verdict } from "~/features/trialCycles/constants";
import { toErrorMessage } from "~/lib/validation";

type Participant = {
	readonly _id: Id<"applications">;
	readonly name: string;
};

type CloseTrialFormProps = {
	readonly trialCycleId: Id<"trialCycles">;
	readonly participants: Participant[];
	readonly canOffer: boolean;
	readonly onDone: () => void;
};

type VerdictDraft = { verdict?: Verdict; evaluation: string };
type ReviewDraft = { decision?: "verify" | "reject"; note: string };

export function CloseTrialForm({
	trialCycleId,
	participants,
	canOffer,
	onDone,
}: CloseTrialFormProps) {
	const pulses = useQuery(api.pulses.listForTrial, { trialCycleId });
	const close = useMutation(api.trialCycles.close);
	const [verdicts, setVerdicts] = useState<Record<string, VerdictDraft>>({});
	const [reviews, setReviews] = useState<Record<string, ReviewDraft>>({});
	const [isPending, setIsPending] = useState(false);

	const submitted = (pulses ?? []).filter((pulse) => pulse.status === "review");
	const verdictOptions = VERDICTS.filter(
		(entry) => canOffer || entry.value !== "passed_with_offer",
	);

	async function submit() {
		setIsPending(true);
		try {
			await close({
				trialCycleId,
				verdicts: participants.flatMap((participant) => {
					const draft = verdicts[participant._id];
					return draft?.verdict
						? [
								{
									applicationId: participant._id,
									verdict: draft.verdict,
									evaluation: draft.evaluation,
								},
							]
						: [];
				}),
				pulseReviews: submitted.flatMap((pulse) => {
					const draft = reviews[pulse._id];
					return draft?.decision
						? [
								{
									pulseId: pulse._id,
									decision: draft.decision,
									note: draft.note,
								},
							]
						: [];
				}),
			});
			toast.success("Trial Cycle closed");
			onDone();
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not close Trial Cycle"));
		} finally {
			setIsPending(false);
		}
	}

	return (
		<form
			className="space-y-6 rounded-lg border p-4"
			onSubmit={(event) => {
				event.preventDefault();
				void submit();
			}}
		>
			<section className="space-y-3">
				<h3 className="font-semibold">Verdicts</h3>
				{participants.map((participant) => {
					const draft = verdicts[participant._id] ?? { evaluation: "" };
					const update = (next: Partial<VerdictDraft>) =>
						setVerdicts({
							...verdicts,
							[participant._id]: { ...draft, ...next },
						});
					return (
						<div key={participant._id} className="space-y-2">
							<div className="flex flex-col gap-2 md:flex-row md:items-center">
								<p className="flex-1 font-medium">{participant.name}</p>
								<select
									required
									value={draft.verdict ?? ""}
									onChange={(event) =>
										update({ verdict: event.target.value as Verdict })
									}
									className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
								>
									<option value="" disabled>
										Choose a Verdict
									</option>
									{verdictOptions.map((entry) => (
										<option key={entry.value} value={entry.value}>
											{entry.label}
										</option>
									))}
								</select>
							</div>
							<Textarea
								value={draft.evaluation}
								onChange={(event) => update({ evaluation: event.target.value })}
								placeholder="Evaluation (optional, private unless they share it)"
							/>
						</div>
					);
				})}
			</section>

			{submitted.length > 0 ? (
				<section className="space-y-3">
					<h3 className="font-semibold">Submitted Pulses</h3>
					{submitted.map((pulse) => {
						const draft = reviews[pulse._id] ?? { note: "" };
						const update = (next: Partial<ReviewDraft>) =>
							setReviews({ ...reviews, [pulse._id]: { ...draft, ...next } });
						return (
							<div key={pulse._id} className="space-y-2">
								<div className="flex flex-col gap-2 md:flex-row md:items-center">
									<p className="flex-1 font-medium">{pulse.title}</p>
									<select
										required
										value={draft.decision ?? ""}
										onChange={(event) =>
											update({
												decision: event.target.value as "verify" | "reject",
											})
										}
										className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
									>
										<option value="" disabled>
											Choose
										</option>
										<option value="verify">Verify</option>
										<option value="reject">Send back</option>
									</select>
								</div>
								{draft.decision === "reject" ? (
									<Textarea
										required
										value={draft.note}
										onChange={(event) => update({ note: event.target.value })}
										placeholder="What needed to change?"
									/>
								) : null}
							</div>
						);
					})}
				</section>
			) : null}

			<div className="flex gap-2">
				<Button type="submit" disabled={isPending || pulses === undefined}>
					Close with Verdicts
				</Button>
				<Button type="button" variant="ghost" onClick={onDone}>
					Back
				</Button>
			</div>
		</form>
	);
}
