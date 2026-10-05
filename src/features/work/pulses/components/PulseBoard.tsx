import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { EmptyState } from "~/components/shared/EmptyState";
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
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { PulseProofLinks } from "~/features/work/pulses/components/PulseProofLinks";
import {
	type ProofLinkKind,
	type PulseStatus,
	WORKABLE_PULSE_STATUSES,
} from "~/features/work/pulses/constants";
import { useTrialBoard } from "~/features/work/pulses/hooks/useTrialBoard";

type PulseBoardProps = {
	readonly startupId: Id<"startups">;
	readonly trialCycleId: Id<"trialCycles">;
	/** Before the start the Board is empty: Challenges arrive when it starts. */
	readonly hasStarted: boolean;
	/** Only the Participant, only while the hackathon runs. */
	readonly isEditable: boolean;
	/** A Founder reading someone else's Board; it is never editable then. */
	readonly participant?: { userId: Id<"users">; name: string };
};

type BoardPulse = {
	_id: Id<"pulses">;
	title: string;
	description: string | null;
	status: PulseStatus;
	proofLinks: { kind: ProofLinkKind; url: string }[];
};

/**
 * A Trial Board in To do, In progress and Done columns: the Participant's
 * own, or one a Founder reads to judge.
 */
export function PulseBoard({
	startupId,
	trialCycleId,
	hasStarted,
	isEditable: canEdit,
	participant,
}: PulseBoardProps) {
	const isEditable = canEdit && participant === undefined;
	const board = useTrialBoard({
		startupId,
		trialCycleId,
		participantUserId: participant?.userId,
		enabled: true,
	});
	const { pulses, pendingId } = board;
	const [title, setTitle] = useState("");
	const [renaming, setRenaming] = useState<BoardPulse | null>(null);
	const [renameTo, setRenameTo] = useState("");
	const [deleting, setDeleting] = useState<BoardPulse | null>(null);

	async function create() {
		if (title.trim() && (await board.create(title.trim()))) {
			setTitle("");
		}
	}

	async function rename() {
		if (renaming && (await board.rename(renaming._id, renameTo))) {
			setRenaming(null);
		}
	}

	async function remove() {
		if (deleting && (await board.remove(deleting._id))) {
			setDeleting(null);
		}
	}

	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold break-words">
				{participant ? `${participant.name}'s Board` : "Your Board"}
			</h2>
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
					<Button
						type="submit"
						disabled={!title.trim() || pendingId === "new"}
						className="h-11"
					>
						Add Pulse
					</Button>
				</form>
			) : null}
			{pulses === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : pulses.length === 0 ? (
				<EmptyState
					title={
						participant
							? "No Pulses on this Board"
							: "Nothing on your Board yet"
					}
					description={
						hasStarted
							? participant
								? `${participant.name} hasn't added any Pulses.`
								: "Add a Pulse for each piece of work you take on."
							: "The Challenges appear here when the hackathon starts."
					}
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-3">
					{WORKABLE_PULSE_STATUSES.map((column) => {
						const items = pulses.filter(
							(pulse) => pulse.status === column.value,
						);
						return (
							<div key={column.value} className="min-w-0 space-y-2">
								<h3 className="text-sm font-medium text-muted-foreground">
									{column.label} · {items.length}
								</h3>
								<ul className="space-y-2">
									{items.map((pulse) => (
										<BoardPulseCard
											key={pulse._id}
											pulse={pulse}
											isEditable={isEditable}
											isPending={pendingId === pulse._id}
											onMove={(status) =>
												void board.setStatus(pulse._id, status)
											}
											onRename={() => {
												setRenameTo(pulse.title);
												setRenaming(pulse);
											}}
											onDelete={() => setDeleting(pulse)}
											onAddProofLink={(url) =>
												board.addProofLink(pulse._id, url)
											}
											onRemoveProofLink={(url) =>
												void board.removeProofLink(pulse._id, url)
											}
										/>
									))}
								</ul>
							</div>
						);
					})}
				</div>
			)}

			<Dialog
				open={renaming !== null}
				onOpenChange={(open) => {
					if (!open) {
						setRenaming(null);
					}
				}}
			>
				<DialogContent>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void rename();
						}}
					>
						<DialogHeader>
							<DialogTitle>Rename Pulse</DialogTitle>
						</DialogHeader>
						<Input
							aria-label="Pulse title"
							value={renameTo}
							onChange={(event) => setRenameTo(event.target.value)}
							className="h-11"
							autoFocus
						/>
						<DialogFooter>
							<Button
								type="submit"
								disabled={!renameTo.trim() || pendingId !== null}
							>
								Save
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={deleting !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleting(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
						<AlertDialogDescription>
							It leaves your Board with its proof links. This can't be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={pendingId !== null}>
							Keep it
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={pendingId !== null}
							onClick={(event) => {
								event.preventDefault();
								void remove();
							}}
						>
							Delete Pulse
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}

type BoardPulseCardProps = {
	readonly pulse: BoardPulse;
	readonly isEditable: boolean;
	readonly isPending: boolean;
	readonly onMove: (status: PulseStatus) => void;
	readonly onRename: () => void;
	readonly onDelete: () => void;
	readonly onAddProofLink: (url: string) => Promise<boolean>;
	readonly onRemoveProofLink: (url: string) => void;
};

function BoardPulseCard({
	pulse,
	isEditable,
	isPending,
	onMove,
	onRename,
	onDelete,
	onAddProofLink,
	onRemoveProofLink,
}: BoardPulseCardProps) {
	return (
		<li className="space-y-3 rounded-lg border p-3">
			<div className="min-w-0">
				<p className="font-medium break-words">{pulse.title}</p>
				{pulse.description ? (
					<p className="whitespace-pre-wrap text-sm break-words text-muted-foreground">
						{pulse.description}
					</p>
				) : null}
			</div>
			<div className="flex flex-wrap items-center gap-1">
				<PulseProofLinks
					proofLinks={pulse.proofLinks}
					canEdit={isEditable}
					isPending={isPending}
					onAdd={onAddProofLink}
					onRemove={onRemoveProofLink}
				/>
			</div>
			{isEditable ? (
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={pulse.status}
						disabled={isPending}
						onValueChange={(status) => onMove(status as PulseStatus)}
					>
						<SelectTrigger size="sm" aria-label="Move Pulse">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{WORKABLE_PULSE_STATUSES.map((status) => (
								<SelectItem key={status.value} value={status.value}>
									{status.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						disabled={isPending}
						onClick={onRename}
					>
						Rename
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						disabled={isPending}
						onClick={onDelete}
					>
						Delete
					</Button>
				</div>
			) : null}
		</li>
	);
}
