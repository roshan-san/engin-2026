import { useBlocker } from "@tanstack/react-router";
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

/** Asks before the Founder leaves the form with unsaved changes. `shouldBlock` must be stable, so the blocker registers once. */
export function LeaveGuardDialog({
	shouldBlock,
}: {
	readonly shouldBlock: () => boolean;
}) {
	const blocker = useBlocker({
		shouldBlockFn: shouldBlock,
		enableBeforeUnload: shouldBlock,
		withResolver: true,
	});

	return (
		<AlertDialog
			open={blocker.status === "blocked"}
			onOpenChange={(open) => {
				if (!open) blocker.reset?.();
			}}
		>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>Leave without saving?</AlertDialogTitle>
					<AlertDialogDescription>
						What you wrote here will be lost.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Stay</AlertDialogCancel>
					<AlertDialogAction onClick={() => blocker.proceed?.()}>
						Leave
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
