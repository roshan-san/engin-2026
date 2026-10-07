import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

const NO_CARRY_OVER = "none";

type CloseCycleDialogProps = {
	readonly title: string;
	readonly plannedCycles: { _id: Id<"cycles">; title: string }[];
	readonly isPending: boolean;
	readonly onClose: (carryOverTo: Id<"cycles"> | null) => Promise<boolean>;
};

/** Closing asks where the unfinished Tasks go: a planned Cycle, or nowhere. */
export function CloseCycleDialog({
	title,
	plannedCycles,
	isPending,
	onClose,
}: CloseCycleDialogProps) {
	const [open, setOpen] = useState(false);
	const [target, setTarget] = useState<string>(
		plannedCycles[0]?._id ?? NO_CARRY_OVER,
	);

	async function submit() {
		const carryOverTo =
			target === NO_CARRY_OVER ? null : (target as Id<"cycles">);
		if (await onClose(carryOverTo)) {
			setOpen(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) {
					setTarget(plannedCycles[0]?._id ?? NO_CARRY_OVER);
				}
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					Close Cycle
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Close “{title}”?</DialogTitle>
					<DialogDescription>
						Done Tasks stay here. Unfinished ones (Todo, In progress, Review)
						can move to a planned Cycle as they are. A closed Cycle is
						read-only.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="carry-over">Carry unfinished Tasks to</Label>
					<Select value={target} onValueChange={setTarget}>
						<SelectTrigger id="carry-over" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{plannedCycles.map((cycle) => (
								<SelectItem key={cycle._id} value={cycle._id}>
									{cycle.title}
								</SelectItem>
							))}
							<SelectItem value={NO_CARRY_OVER}>Don't carry over</SelectItem>
						</SelectContent>
					</Select>
					{plannedCycles.length === 0 ? (
						<p className="text-xs text-muted-foreground">
							Plan another Cycle first to carry work over.
						</p>
					) : null}
				</div>
				<DialogFooter>
					<Button
						type="button"
						disabled={isPending}
						onClick={() => void submit()}
					>
						Close Cycle
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
