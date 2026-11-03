import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { dayLabel } from "~/shared/lib/dates";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/shared/ui/alert-dialog";
import { Button } from "~/shared/ui/button";
import { useMyPlace } from "../api/useMyPlace";

/** Confirm your place by its deadline, and Withdraw, which asks first. */
export function MyPlace({
	applicationId,
	confirmBy,
	isConfirmed,
}: {
	readonly applicationId: Id<"applications">;
	/** Shown with Confirm until they've confirmed; `null` for an Applicant not accepted yet. */
	readonly confirmBy: number | null;
	readonly isConfirmed: boolean;
}) {
	const { confirm, withdraw } = useMyPlace(applicationId);
	const [isAsking, setIsAsking] = useState(false);

	return (
		<div className="flex flex-col gap-2">
			{!isConfirmed && confirmBy !== null ? (
				<>
					<p className="text-sm">
						Confirm your place by {dayLabel(confirmBy)}, or it goes to someone
						else.
					</p>
					<Button className="self-start" onClick={() => void confirm()}>
						Confirm my place
					</Button>
				</>
			) : null}
			<Button
				variant="ghost"
				size="sm"
				className="self-start text-muted-foreground"
				onClick={() => setIsAsking(true)}
			>
				Withdraw
			</Button>
			<AlertDialog open={isAsking} onOpenChange={setIsAsking}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Withdraw from this Hackathon?</AlertDialogTitle>
						<AlertDialogDescription>
							The Founder sees you withdrew. You can't undo it.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => void withdraw()}
						>
							Withdraw
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
