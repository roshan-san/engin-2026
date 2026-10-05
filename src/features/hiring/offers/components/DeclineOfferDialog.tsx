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

type DeclineOfferDialogProps = {
	/** The startup whose Offer is being declined; `null` closes the dialog. */
	readonly startupName: string | null;
	readonly isPending: boolean;
	readonly onCancel: () => void;
	readonly onConfirm: () => void;
};

/** Confirms declining an Offer, which can't be undone. */
export function DeclineOfferDialog({
	startupName,
	isPending,
	onCancel,
	onConfirm,
}: DeclineOfferDialogProps) {
	return (
		<AlertDialog
			open={startupName !== null}
			onOpenChange={(open) => {
				if (!open) {
					onCancel();
				}
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Decline {startupName}'s offer?</AlertDialogTitle>
					<AlertDialogDescription>
						You can't accept it later. Your Verdict and its Score stay.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Keep it</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={isPending}
						onClick={(event) => {
							event.preventDefault();
							onConfirm();
						}}
					>
						Decline offer
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
