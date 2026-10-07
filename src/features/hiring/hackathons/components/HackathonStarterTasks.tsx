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
import type { HackathonStatus } from "~/features/hiring/hackathons/constants";
import { useStarterTasks } from "~/features/hiring/hackathons/hooks/useStarterTasks";

type HackathonStarterTasksProps = {
	readonly hackathonId: Id<"hackathons">;
	readonly status: HackathonStatus;
	/** A Founder, while the hackathon is unpublished, open or running. */
	readonly canEdit: boolean;
};

type StarterTask = { _id: Id<"tasks">; title: string };

export function HackathonStarterTasks({
	hackathonId,
	status,
	canEdit,
}: HackathonStarterTasksProps) {
	const { starterTasks, isPending, add, remove } = useStarterTasks(hackathonId);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [confirming, setConfirming] = useState<StarterTask | null>(null);
	const isRunning = status === "active";

	async function removeConfirmed() {
		if (confirming && (await remove(confirming._id))) {
			setConfirming(null);
		}
	}

	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-lg font-semibold">Starter Tasks</h2>
				<p className="text-sm text-muted-foreground">
					{isRunning
						? "A Starter Task you add now goes straight onto every Participant's Board."
						: "Every Participant gets their own copy on their Board when the hackathon starts."}
				</p>
			</div>
			{starterTasks === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : starterTasks.length === 0 ? (
				<p className="text-sm text-muted-foreground">No Starter Tasks yet.</p>
			) : (
				<ol className="space-y-2">
					{starterTasks.map((starterTask, index) => (
						<li
							key={starterTask._id}
							className="flex items-start gap-3 rounded-lg border p-4"
						>
							<span className="text-sm text-muted-foreground">
								{index + 1}.
							</span>
							<div className="min-w-0 flex-1">
								<p className="font-medium break-words">{starterTask.title}</p>
								{starterTask.description ? (
									<p className="whitespace-pre-wrap text-sm break-words text-muted-foreground">
										{starterTask.description}
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
											? setConfirming(starterTask)
											: void remove(starterTask._id)
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
						placeholder="Starter Task title"
						className="h-11"
					/>
					<Textarea
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						placeholder="What should Participants deliver? (optional)"
					/>
					<Button type="submit" disabled={isPending || !title.trim()}>
						Add Starter Task
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
							It leaves the Starter Task list and the public page. Participants
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
							Remove Starter Task
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
