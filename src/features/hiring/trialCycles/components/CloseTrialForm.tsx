import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { ParticipantBoardSheet } from "~/features/hiring/trialCycles/components/ParticipantBoardSheet";
import {
	VERDICTS,
	type Verdict,
} from "~/features/hiring/trialCycles/constants";
import {
	useCloseTrial,
	type VerdictInput,
} from "~/features/hiring/trialCycles/hooks/useCloseTrial";

type Participant = {
	readonly applicationId: Id<"applications">;
	readonly userId: Id<"users">;
	readonly name: string;
};

type CloseTrialFormProps = {
	readonly startupId: Id<"startups">;
	readonly trialCycleId: Id<"trialCycles">;
	readonly trialTitle: string;
	readonly participants: Participant[];
	/** False once the Role is filled: no more Offers. */
	readonly canOffer: boolean;
	readonly onDone: () => void;
};

type VerdictDraft = { verdict?: Verdict; evaluation: string };

/** A Founder gives every Participant a Verdict, then closes the hackathon. */
export function CloseTrialForm({
	startupId,
	trialCycleId,
	trialTitle,
	participants,
	canOffer,
	onDone,
}: CloseTrialFormProps) {
	const { close, isPending } = useCloseTrial(trialCycleId);
	const [drafts, setDrafts] = useState<Record<string, VerdictDraft>>({});
	const [isConfirming, setIsConfirming] = useState(false);

	const verdictOptions = VERDICTS.filter(
		(entry) => canOffer || entry.value !== "passed_with_offer",
	);
	const verdicts: VerdictInput[] = participants.flatMap((participant) => {
		const draft = drafts[participant.applicationId];
		return draft?.verdict
			? [
					{
						applicationId: participant.applicationId,
						verdict: draft.verdict,
						evaluation: draft.evaluation,
					},
				]
			: [];
	});
	const isComplete = verdicts.length === participants.length;

	async function submit() {
		if (await close(verdicts)) {
			setIsConfirming(false);
			onDone();
		}
	}

	return (
		<section className="space-y-4">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold">Close with Verdicts</h2>
				<p className="text-sm text-muted-foreground">
					Give every Participant a Verdict. Evaluations are private unless the
					Participant shows theirs on their profile.
				</p>
				{canOffer ? null : (
					<p className="text-sm text-muted-foreground">
						This Role is filled, so it can't make Offers
					</p>
				)}
			</div>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					setIsConfirming(true);
				}}
			>
				{participants.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nobody is taking part, so there are no Verdicts to give.
					</p>
				) : null}
				<ul className="space-y-3">
					{participants.map((participant) => {
						const draft = drafts[participant.applicationId] ?? {
							evaluation: "",
						};
						const update = (next: Partial<VerdictDraft>) =>
							setDrafts({
								...drafts,
								[participant.applicationId]: { ...draft, ...next },
							});
						return (
							<li
								key={participant.applicationId}
								className="space-y-3 rounded-lg border p-4"
							>
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
									<p className="min-w-0 flex-1 font-medium break-words">
										{participant.name}
									</p>
									<ParticipantBoardSheet
										startupId={startupId}
										trialCycleId={trialCycleId}
										participant={participant}
									/>
									<Select
										value={draft.verdict ?? ""}
										onValueChange={(verdict) =>
											update({ verdict: verdict as Verdict })
										}
									>
										<SelectTrigger
											className="w-full sm:w-48"
											aria-label={`Verdict for ${participant.name}`}
										>
											<SelectValue placeholder="Choose a Verdict" />
										</SelectTrigger>
										<SelectContent>
											{verdictOptions.map((entry) => (
												<SelectItem key={entry.value} value={entry.value}>
													{entry.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<Textarea
									value={draft.evaluation}
									onChange={(event) =>
										update({ evaluation: event.target.value })
									}
									aria-label={`Evaluation for ${participant.name}`}
									placeholder="Evaluation (optional)"
								/>
							</li>
						);
					})}
				</ul>

				<div className="flex flex-wrap gap-2">
					<Button type="submit" disabled={!isComplete || isPending}>
						Close with Verdicts
					</Button>
					<Button type="button" variant="ghost" onClick={onDone}>
						Back
					</Button>
				</div>
			</form>

			<AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Close “{trialTitle}”?</AlertDialogTitle>
						<AlertDialogDescription>
							Verdicts can't be changed after the close, and Offers go out at
							once.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Not yet</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending}
							onClick={(event) => {
								event.preventDefault();
								void submit();
							}}
						>
							Close hackathon
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
