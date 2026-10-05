import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useCreateCycle } from "~/features/work/cycles/hooks/useCycles";

type CreateCycleDialogProps = {
	readonly slug: string;
	readonly startupId: Id<"startups"> | undefined;
};

/** A Founder plans the next Cycle; it opens once created. */
export function CreateCycleDialog({ slug, startupId }: CreateCycleDialogProps) {
	const { create, isPending } = useCreateCycle(startupId);
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");

	async function submit() {
		const cycleId = await create({ title, startAt, endAt });
		if (cycleId) {
			setOpen(false);
			setTitle("");
			setStartAt("");
			setEndAt("");
			void navigate({
				to: "/s/$slug/cycles/$cycleId",
				params: { slug, cycleId },
			});
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">New Cycle</Button>
			</DialogTrigger>
			<DialogContent>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						void submit();
					}}
				>
					<DialogHeader>
						<DialogTitle>New Cycle</DialogTitle>
						<DialogDescription>
							It starts out planned. Start it when the team is ready.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="cycle-title">Title</Label>
						<Input
							id="cycle-title"
							required
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="Cycle 12"
							className="h-11"
						/>
					</div>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="cycle-start">Starts</Label>
							<Input
								id="cycle-start"
								required
								type="date"
								value={startAt}
								onChange={(event) => setStartAt(event.target.value)}
								className="h-11"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="cycle-end">Ends</Label>
							<Input
								id="cycle-end"
								required
								type="date"
								value={endAt}
								onChange={(event) => setEndAt(event.target.value)}
								className="h-11"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="submit"
							disabled={isPending || !title.trim() || !startAt || !endAt}
						>
							Create Cycle
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
