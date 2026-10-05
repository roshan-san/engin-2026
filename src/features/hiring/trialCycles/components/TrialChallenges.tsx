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
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { TrialStatus } from "~/features/hiring/trialCycles/constants";
import { useTrialChallenges } from "~/features/hiring/trialCycles/hooks/useTrialChallenges";

type TrialChallengesProps = {
	readonly trialCycleId: Id<"trialCycles">;
	readonly status: TrialStatus;
	/** A Founder, while the hackathon is unpublished, open or running. */
	readonly canEdit: boolean;
};

type Challenge = { _id: Id<"challenges">; title: string };

export function TrialChallenges({
	trialCycleId,
	status,
	canEdit,
}: TrialChallengesProps) {
	const { challenges, isPending, add, remove } =
		useTrialChallenges(trialCycleId);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [confirming, setConfirming] = useState<Challenge | null>(null);
	const isRunning = status === "active";

	async function removeConfirmed() {
		if (confirming && (await remove(confirming._id))) {
			setConfirming(null);
		}
	}

	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold">Challenges</h2>
				<p className="text-sm text-muted-foreground">
					{isRunning
						? "A Challenge you add now goes straight onto every Participant's Board."
						: "Every Participant gets their own copy on their Board when the hackathon starts."}
				</p>
			</div>
			{challenges === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : challenges.length === 0 ? (
				<p className="text-sm text-muted-foreground">No Challenges yet.</p>
			) : (
				<ol className="space-y-2">
					{challenges.map((challenge, index) => (
						<li
							key={challenge._id}
							className="flex items-start gap-3 rounded-lg border p-4"
						>
							<span className="text-sm text-muted-foreground">
								{index + 1}.
							</span>
							<div className="min-w-0 flex-1">
								<p className="font-medium break-words">{challenge.title}</p>
								{challenge.description ? (
									<p className="whitespace-pre-wrap text-sm break-words text-muted-foreground">
										{challenge.description}
									</p>
								) : null}
							</div>
							{canEdit ? (
								<Button
									type="button"
									size="sm"
									variant="ghost"
									disabled={isPending}
									onClick={() =>
										isRunning
											? setConfirming(challenge)
											: void remove(challenge._id)
									}
								>
									Remove
								</Button>
							) : null}
						</li>
					))}
				</ol>
			)}
			{canEdit ? (
				<form
					className="space-y-2"
					onSubmit={(event) => {
						event.preventDefault();
						void add(title, description).then((added) => {
							if (added) {
								setTitle("");
								setDescription("");
							}
						});
					}}
				>
					<Input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Challenge title"
						className="h-11"
					/>
					<Textarea
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						placeholder="What should Participants deliver? (optional)"
					/>
					<Button type="submit" disabled={isPending || !title.trim()}>
						Add Challenge
					</Button>
				</form>
			) : null}
			<AlertDialog
				open={confirming !== null}
				onOpenChange={(open) => {
					if (!open) {
						setConfirming(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove “{confirming?.title}”?</AlertDialogTitle>
						<AlertDialogDescription>
							It leaves the Challenge list and the public page. Participants
							keep their copies and any work on them, and they're told it was
							removed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Keep it</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={isPending}
							onClick={(event) => {
								event.preventDefault();
								void removeConfirmed();
							}}
						>
							Remove Challenge
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
