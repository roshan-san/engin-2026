import { type ReactNode, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

/** A quiet button that asks first, then runs a destructive action; the dialog closes only once it succeeds. */
export function ConfirmButton({
	label,
	title,
	description,
	actionLabel,
	onConfirm,
}: {
	readonly label: string;
	readonly title: ReactNode;
	readonly description: ReactNode;
	readonly actionLabel: string;
	/** Resolves `true` once done (the error is shown already otherwise). */
	readonly onConfirm: () => Promise<boolean>;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [isBusy, setIsBusy] = useState(false);

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="ghost" size="sm" className="text-muted-foreground">
					{label}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={isBusy}
						onClick={async (event) => {
							event.preventDefault();
							setIsBusy(true);
							if (await onConfirm()) setIsOpen(false);
							setIsBusy(false);
						}}
					>
						{actionLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
