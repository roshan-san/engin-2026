import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { NewRoleForm } from "~/features/hiring/roles/components/NewRoleForm";

/** "New Role" from the Hiring screen: create a Role without starting a hackathon. */
export function NewRoleDialog({
	startupId,
}: {
	readonly startupId: Id<"startups">;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="sm">
					New Role
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader className="sr-only">
					<DialogTitle>Create a Role</DialogTitle>
					<DialogDescription>
						Roles are what a hackathon hires for.
					</DialogDescription>
				</DialogHeader>
				<NewRoleForm
					startupId={startupId}
					onCreated={() => {
						setOpen(false);
						toast.success("Role created");
					}}
					onCancel={() => setOpen(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
