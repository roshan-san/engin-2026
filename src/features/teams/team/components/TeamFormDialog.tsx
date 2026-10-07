import { MAX_TEAM_DESCRIPTION, MAX_TEAM_NAME } from "@convex/lib/limits";
import { useEffect, useState } from "react";
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
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";

type TeamInput = { name: string; description?: string };

type TeamFormDialogProps = {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	/** Present when editing an existing Team. */
	readonly initial?: TeamInput;
	readonly onSubmit: (input: TeamInput) => Promise<boolean>;
};

/** Creates or renames a Team. */
export function TeamFormDialog({
	open,
	onOpenChange,
	initial,
	onSubmit,
}: TeamFormDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isPending, setIsPending] = useState(false);

	useEffect(() => {
		if (open) {
			setName(initial?.name ?? "");
			setDescription(initial?.description ?? "");
		}
	}, [open, initial?.name, initial?.description]);

	async function submit() {
		setIsPending(true);
		const saved = await onSubmit({ name, description });
		setIsPending(false);
		if (saved) {
			onOpenChange(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						void submit();
					}}
				>
					<DialogHeader>
						<DialogTitle>{initial ? "Edit Team" : "New Team"}</DialogTitle>
						<DialogDescription>
							Teams group people, Roles and Cycles. Everyone still sees the
							whole Startup.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="team-name">Name</Label>
						<Input
							id="team-name"
							required
							maxLength={MAX_TEAM_NAME}
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Payments"
							className="h-11"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="team-description">Description</Label>
						<Textarea
							id="team-description"
							maxLength={MAX_TEAM_DESCRIPTION}
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="What this Team owns"
							rows={3}
						/>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isPending || !name.trim()}>
							{isPending ? <Spinner /> : null}
							{initial ? "Save" : "Create Team"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
