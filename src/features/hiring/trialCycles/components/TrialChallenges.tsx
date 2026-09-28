import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { toErrorMessage } from "~/lib/validation";

type TrialChallengesProps = {
	readonly trialCycleId: Id<"trialCycles">;
};

/** Challenges are copied onto each Participant's Board when the Trial Cycle starts. */
export function TrialChallenges({ trialCycleId }: TrialChallengesProps) {
	const challenges = useQuery(api.hiring.challenges.list, { trialCycleId });
	const addChallenge = useMutation(api.hiring.challenges.add);
	const removeChallenge = useMutation(api.hiring.challenges.remove);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	async function run(action: () => Promise<unknown>) {
		try {
			await action();
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not update Challenges"));
		}
	}

	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold">Challenges</h2>
				<p className="text-sm text-muted-foreground">
					Every Participant gets their own copy on their Board when the Trial
					Cycle starts.
				</p>
			</div>
			{challenges === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : (
				<ul className="space-y-2">
					{challenges.map((challenge) => (
						<li
							key={challenge._id}
							className="flex items-start gap-3 rounded-lg border p-4"
						>
							<div className="min-w-0 flex-1">
								<p className="font-medium">{challenge.title}</p>
								{challenge.description ? (
									<p className="whitespace-pre-wrap text-sm text-muted-foreground">
										{challenge.description}
									</p>
								) : null}
							</div>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() =>
									void run(() =>
										removeChallenge({ challengeId: challenge._id }),
									)
								}
							>
								Remove
							</Button>
						</li>
					))}
				</ul>
			)}
			<form
				className="space-y-2"
				onSubmit={(event) => {
					event.preventDefault();
					void run(async () => {
						await addChallenge({ trialCycleId, title, description });
						setTitle("");
						setDescription("");
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
				<Button type="submit" disabled={!title.trim()}>
					Add Challenge
				</Button>
			</form>
		</section>
	);
}
