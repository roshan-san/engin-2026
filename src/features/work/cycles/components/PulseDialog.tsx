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
import type { CyclePulse } from "~/features/work/cycles/hooks/useCyclePulses";
import { PulseProofLinks } from "~/features/work/pulses/components/PulseProofLinks";
import { PULSE_STATUSES } from "~/features/work/pulses/constants";

type PulseDialogProps = {
	/** The open Pulse, read live from the board; null closes the dialog. */
	readonly pulse: CyclePulse | null;
	readonly isFounder: boolean;
	readonly isReadOnly: boolean;
	readonly isPending: boolean;
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
 * One Cycle Pulse in full: members edit it and attach proof while it is in
 * Todo or In progress; a Founder reviews it from here once it is in Review.
 */
export function PulseDialog({
	pulse,
	isFounder,
	isReadOnly,
	isPending,
	onClose,
	onEdit,
	onDelete,
	onTake,
	onAddProofLink,
	onRemoveProofLink,
	onVerify,
	onSendBack,
}: PulseDialogProps) {
	return (
		<Dialog
			open={pulse !== null}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
		>
			<DialogContent className="max-h-[90dvh] overflow-y-auto">
				{pulse ? (
					<PulseDetails
						key={pulse._id}
						pulse={pulse}
						isFounder={isFounder}
						isReadOnly={isReadOnly}
						isPending={isPending}
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

type PulseDetailsProps = Omit<PulseDialogProps, "pulse" | "onClose"> & {
	readonly pulse: CyclePulse;
};

function PulseDetails({
	pulse,
	isFounder,
	isReadOnly,
	isPending,
	onEdit,
	onDelete,
	onTake,
	onAddProofLink,
	onRemoveProofLink,
	onVerify,
	onSendBack,
}: PulseDetailsProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [title, setTitle] = useState(pulse.title);
	const [description, setDescription] = useState(pulse.description ?? "");
	const [isDeleting, setIsDeleting] = useState(false);
	const isWorkable =
		!isReadOnly && (pulse.status === "todo" || pulse.status === "in_progress");
	const isReviewable = !isReadOnly && isFounder && pulse.status === "review";
	const statusLabel =
		PULSE_STATUSES.find((status) => status.value === pulse.status)?.label ??
		pulse.status;
	const assignee =
		pulse.assignee?.name ?? pulse.assignee?.username ?? "Unassigned";

	function startEditing() {
		setTitle(pulse.title);
		setDescription(pulse.description ?? "");
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
					<DialogTitle>Edit Pulse</DialogTitle>
					<DialogDescription>
						Everyone in the Cycle sees the change.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="pulse-title">Title</Label>
					<Input
						id="pulse-title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						className="h-11"
						autoFocus
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="pulse-description">Description</Label>
					<Textarea
						id="pulse-description"
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
				<DialogTitle className="pr-6 break-words">{pulse.title}</DialogTitle>
				<DialogDescription className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">{statusLabel}</Badge>
					<span>{assignee}</span>
				</DialogDescription>
			</DialogHeader>

			{pulse.description ? (
				<p className="text-sm whitespace-pre-wrap break-words">
					{pulse.description}
				</p>
			) : (
				<p className="text-sm text-muted-foreground">No description.</p>
			)}

			{pulse.reviewNote && pulse.status === "in_progress" ? (
				<p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm break-words text-destructive">
					Sent back: {pulse.reviewNote}
				</p>
			) : null}

			<section className="space-y-2">
				<h3 className="text-sm font-medium">Proof</h3>
				<div className="flex flex-wrap items-center gap-1">
					{pulse.proofLinks.length === 0 && !isWorkable ? (
						<p className="text-sm text-muted-foreground">No proof attached.</p>
					) : null}
					<PulseProofLinks
						proofLinks={pulse.proofLinks}
						canEdit={isWorkable}
						isPending={isPending}
						onAdd={onAddProofLink}
						onRemove={onRemoveProofLink}
					/>
				</div>
			</section>

			{pulse.status === "review" && !isFounder ? (
				<p className="text-sm text-muted-foreground">
					Awaiting a Founder's review.
				</p>
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
					{pulse.assignee ? null : (
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
					{pulse.canDelete ? (
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
						<AlertDialogTitle>Delete “{pulse.title}”?</AlertDialogTitle>
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
							Delete Pulse
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
