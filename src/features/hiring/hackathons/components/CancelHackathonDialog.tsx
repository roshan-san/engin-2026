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
import { Spinner } from "~/components/ui/spinner";
import type { HackathonStatus } from "~/features/hiring/hackathons/constants";

const CANCEL_EFFECTS: Partial<Record<HackathonStatus, string>> = {
	draft: "It leaves your unpublished hackathons. Nobody else has seen it.",
	open: "It comes off the public listings, and everyone who applied is told.",
	active:
		"Work stops for every participant, and they're told. Nobody's Score changes.",
};

type CancelHackathonDialogProps = {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly title: string;
	readonly status: HackathonStatus;
	/** An extra line about what cancelling costs or returns, such as a refund. */
	readonly consequence?: string;
	readonly isPending: boolean;
	readonly onConfirm: () => void;
};

export function CancelHackathonDialog({
	open,
	onOpenChange,
	title,
	status,
	consequence,
	isPending,
	onConfirm,
}: CancelHackathonDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel “{title}”?</AlertDialogTitle>
					<AlertDialogDescription>
						{CANCEL_EFFECTS[status]} This can't be undone.
						{consequence ? ` ${consequence}` : null}
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
						{isPending ? <Spinner /> : null}
						Cancel Hackathon
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
