import type { Id } from "@convex/_generated/dataModel";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
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
import { Textarea } from "~/components/ui/textarea";
import {
	BoardCard,
	PulseSummary,
} from "~/features/work/cycles/components/BoardCard";
import { BoardColumn } from "~/features/work/cycles/components/BoardColumn";
import { PulseDialog } from "~/features/work/cycles/components/PulseDialog";
import {
	type CyclePulse,
	useCyclePulses,
} from "~/features/work/cycles/hooks/useCyclePulses";
import {
	PULSE_STATUSES,
	type PulseStatus,
} from "~/features/work/pulses/constants";

type CycleBoardProps = {
	readonly startupId: Id<"startups">;
	readonly cycleId: Id<"cycles">;
	readonly isFounder: boolean;
	/** A closed Cycle's board is read-only. */
	readonly isReadOnly: boolean;
};

/**
 * The Cycle's kanban. Cards drag by mouse, by touch (press and hold the grip)
 * or by keyboard, and each card's menu offers the same moves.
 */
export function CycleBoard({
	startupId,
	cycleId,
	isFounder,
	isReadOnly,
}: CycleBoardProps) {
	const board = useCyclePulses(cycleId, isFounder);
	const { pulses, pendingId } = board;
	const [title, setTitle] = useState("");
	const [active, setActive] = useState<CyclePulse | null>(null);
	const [returning, setReturning] = useState<CyclePulse | null>(null);
	const [note, setNote] = useState("");
	const [openId, setOpenId] = useState<Id<"pulses"> | null>(null);
	const opened = pulses?.find((pulse) => pulse._id === openId) ?? null;
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 200, tolerance: 8 },
		}),
		useSensor(KeyboardSensor),
	);

	function move(pulse: CyclePulse, to: PulseStatus) {
		if (board.move(pulse._id, pulse.status, to) === "needs_note") {
			setNote("");
			setReturning(pulse);
		}
	}

	function onDragStart(event: DragStartEvent) {
		setActive(pulses?.find((pulse) => pulse._id === event.active.id) ?? null);
	}

	function onDragEnd(event: DragEndEvent) {
		const pulse = active;
		setActive(null);
		if (pulse && event.over) {
			move(pulse, event.over.id as PulseStatus);
		}
	}

	async function create() {
		if (title.trim() && (await board.create(startupId, title.trim()))) {
			setTitle("");
		}
	}

	async function sendBack() {
		if (returning && (await board.returnWithNote(returning._id, note))) {
			setReturning(null);
		}
	}

	return (
		<section className="space-y-4">
			{isReadOnly ? null : (
				<form
					className="flex flex-col gap-2 sm:flex-row"
					onSubmit={(event) => {
						event.preventDefault();
						void create();
					}}
				>
					<Input
						aria-label="Pulse title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Add a Pulse to this Cycle"
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
			)}

			{pulses === undefined ? (
				<p className="text-sm text-muted-foreground">Loading Pulses…</p>
			) : (
				<DndContext
					sensors={sensors}
					onDragStart={onDragStart}
					onDragEnd={onDragEnd}
					onDragCancel={() => setActive(null)}
				>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
						{PULSE_STATUSES.map((column) => {
							const items = pulses.filter(
								(pulse) => pulse.status === column.value,
							);
							return (
								<BoardColumn
									key={column.value}
									status={column.value}
									label={column.label}
									count={items.length}
									dragged={active?.status ?? null}
									isFounder={isFounder}
								>
									{items.map((pulse) => (
										<BoardCard
											key={pulse._id}
											pulse={pulse}
											isFounder={isFounder}
											isReadOnly={isReadOnly}
											isPending={pendingId === pulse._id}
											onMove={(to) => move(pulse, to)}
											onTake={() => void board.take(pulse._id)}
											onOpen={() => setOpenId(pulse._id)}
										/>
									))}
								</BoardColumn>
							);
						})}
					</div>
					<DragOverlay>
						{active ? (
							<div className="cursor-grabbing rounded-lg border bg-background p-3 shadow-lg">
								<PulseSummary pulse={active} />
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			)}

			<PulseDialog
				pulse={opened}
				isFounder={isFounder}
				isReadOnly={isReadOnly}
				isPending={opened !== null && pendingId === opened._id}
				onClose={() => setOpenId(null)}
				onEdit={(title, description) =>
					opened
						? board.edit(opened._id, title, description)
						: Promise.resolve(false)
				}
				onDelete={() =>
					opened ? board.remove(opened._id) : Promise.resolve(false)
				}
				onTake={() => opened && void board.take(opened._id)}
				onAddProofLink={(url) =>
					opened ? board.addProofLink(opened._id, url) : Promise.resolve(false)
				}
				onRemoveProofLink={(url) =>
					opened && void board.removeProofLink(opened._id, url)
				}
				onVerify={() => opened && void board.verify(opened._id)}
				onSendBack={() => {
					if (opened) {
						setOpenId(null);
						setNote("");
						setReturning(opened);
					}
				}}
			/>

			<Dialog
				open={returning !== null}
				onOpenChange={(open) => {
					if (!open) {
						setReturning(null);
					}
				}}
			>
				<DialogContent>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void sendBack();
						}}
					>
						<DialogHeader>
							<DialogTitle>Send back “{returning?.title}”</DialogTitle>
							<DialogDescription>
								It returns to In progress with your note.
							</DialogDescription>
						</DialogHeader>
						<Textarea
							aria-label="What needs to change?"
							placeholder="What needs to change?"
							value={note}
							onChange={(event) => setNote(event.target.value)}
							autoFocus
						/>
						<DialogFooter>
							<Button
								type="submit"
								disabled={!note.trim() || pendingId !== null}
							>
								Send back
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</section>
	);
}
