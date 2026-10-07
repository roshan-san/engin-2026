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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { CycleTask } from "~/features/work/cycles/hooks/useCycleTasks";
import { TaskProofLinks } from "~/features/work/tasks/components/TaskProofLinks";
import { TASK_STATUSES } from "~/features/work/tasks/constants";

type TaskDialogProps = {
	/** The open Task, read live from the board; null closes the dialog. */
	readonly task: CycleTask | null;
	readonly isFounder: boolean;
	readonly isReadOnly: boolean;
	readonly isPending: boolean;
	/** Taking unassigned work: team Cycles only, since a lane is fixed. */
	readonly canTake: boolean;
	readonly onClose: () => void;
	readonly onEdit: (title: string, description: string) => Promise<boolean>;
	readonly onDelete: () => Promise<boolean>;
	readonly onTake: () => void;
	readonly onAddProofLink: (url: string) => Promise<boolean>;
	readonly onRemoveProofLink: (url: string) => void;
	readonly onVerify: () => void;
	/** Opens the board's return-note dialog. */
	readonly onSendBack: () => void;
};

/**
 * One Cycle Task in full: members edit it and attach proof while it is in
 * Todo or In progress; a Founder reviews it from here once it is in Review.
 */
export function TaskDialog({
	task,
	isFounder,
	isReadOnly,
	isPending,
	canTake,
	onClose,
	onEdit,
	onDelete,
	onTake,
	onAddProofLink,
	onRemoveProofLink,
	onVerify,
	onSendBack,
}: TaskDialogProps) {
	return (
		<Dialog
			open={task !== null}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
		>
			<DialogContent className="max-h-[90dvh] overflow-y-auto">
				{task ? (
					<TaskDetails
						key={task._id}
						task={task}
						isFounder={isFounder}
						isReadOnly={isReadOnly}
						isPending={isPending}
						canTake={canTake}
						onEdit={onEdit}
						onDelete={onDelete}
						onTake={onTake}
						onAddProofLink={onAddProofLink}
						onRemoveProofLink={onRemoveProofLink}
						onVerify={onVerify}
						onSendBack={onSendBack}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

type TaskDetailsProps = Omit<TaskDialogProps, "task" | "onClose"> & {
	readonly task: CycleTask;
};

function TaskDetails({
	task,
	isFounder,
	isReadOnly,
	isPending,
	canTake,
	onEdit,
	onDelete,
	onTake,
	onAddProofLink,
	onRemoveProofLink,
	onVerify,
	onSendBack,
}: TaskDetailsProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description ?? "");
	const [isDeleting, setIsDeleting] = useState(false);
	const isWorkable = !isReadOnly && isWorkableStatus(task.status);
	const isReviewable = !isReadOnly && isFounder && task.status === "review";
	const statusLabel =
		TASK_STATUSES.find((status) => status.value === task.status)?.label ??
		task.status;
	const assignee =
		task.assignee?.name ?? task.assignee?.username ?? "Unassigned";

	function startEditing() {
		setTitle(task.title);
		setDescription(task.description ?? "");
		setIsEditing(true);
	}

	async function save() {
		if (title.trim() && (await onEdit(title.trim(), description))) {
			setIsEditing(false);
		}
	}

	if (isEditing) {
		return (
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					void save();
				}}
			>
				<DialogHeader>
					<DialogTitle>Edit Task</DialogTitle>
					<DialogDescription>
						Everyone in the Cycle sees the change.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="task-title">Title</Label>
					<Input
						id="task-title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						className="h-11"
						autoFocus
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="task-description">Description</Label>
					<Textarea
						id="task-description"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						placeholder="What does done look like?"
						rows={4}
					/>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => setIsEditing(false)}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={!title.trim() || isPending}>
						Save
					</Button>
				</DialogFooter>
			</form>
		);
	}

	return (
		<div className="min-w-0 space-y-4">
			<DialogHeader>
				<DialogTitle className="pr-6 break-words">{task.title}</DialogTitle>
				<DialogDescription className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">{statusLabel}</Badge>
					<span>{assignee}</span>
				</DialogDescription>
			</DialogHeader>

			{task.reviewNote && isWorkableStatus(task.status) ? (
				<div className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-3">
					<p className="text-xs font-medium text-destructive">
						Changes requested
					</p>
					<p className="text-sm whitespace-pre-wrap break-words">
						{task.reviewNote}
					</p>
				</div>
			) : null}

			{task.description ? (
				<p className="text-sm whitespace-pre-wrap break-words">
					{task.description}
				</p>
			) : (
				<p className="text-sm text-muted-foreground">No description.</p>
			)}

			<section className="space-y-2">
				<h3 className="text-sm font-medium">Proof</h3>
				<div className="flex flex-wrap items-center gap-1">
					{task.proofLinks.length === 0 && !isWorkable ? (
						<p className="text-sm text-muted-foreground">No proof attached.</p>
					) : null}
					<TaskProofLinks
						proofLinks={task.proofLinks}
						canEdit={isWorkable}
						isPending={isPending}
						onAdd={onAddProofLink}
						onRemove={onRemoveProofLink}
					/>
				</div>
			</section>

			{task.status === "review" && !isFounder ? (
				<p className="text-sm text-muted-foreground">Waiting for a Founder.</p>
			) : null}

			{isReviewable ? (
				<div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						disabled={isPending}
						onClick={onSendBack}
					>
						Send back
					</Button>
					<Button type="button" disabled={isPending} onClick={onVerify}>
						Verify
					</Button>
				</div>
			) : null}

			{isWorkable ? (
				<div className="flex flex-wrap items-center gap-2 border-t pt-4">
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={isPending}
						onClick={startEditing}
					>
						Edit
					</Button>
					{task.assignee || !canTake ? null : (
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isPending}
							onClick={onTake}
						>
							Take
						</Button>
					)}
					{task.canDelete ? (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							className="ml-auto text-destructive"
							disabled={isPending}
							onClick={() => setIsDeleting(true)}
						>
							Delete
						</Button>
					) : null}
				</div>
			) : null}

			<AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete “{task.title}”?</AlertDialogTitle>
						<AlertDialogDescription>
							It leaves the Cycle with its proof links. This can't be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Keep it</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={isPending}
							onClick={(event) => {
								event.preventDefault();
								void onDelete().then((deleted) => {
									if (deleted) {
										setIsDeleting(false);
									}
								});
							}}
						>
							Delete Task
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

/** To do and In progress: where work, and a sent-back note, live. */
function isWorkableStatus(status: CycleTask["status"]): boolean {
	return status === "todo" || status === "in_progress";
}
