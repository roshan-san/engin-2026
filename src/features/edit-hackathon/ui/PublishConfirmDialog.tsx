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

/** The question Publish asks first; `onConfirm` runs once it's accepted. */
export function PublishConfirmDialog({
	open,
	onOpenChange,
	confirmation,
	actionLabel,
	onConfirm,
}: {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly confirmation: { title: string; description: string } | null;
	readonly actionLabel: string | undefined;
	readonly onConfirm: () => void;
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
					<AlertDialogDescription>
						{confirmation?.description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						{actionLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
