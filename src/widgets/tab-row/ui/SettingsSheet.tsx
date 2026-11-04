import { useStartup } from "~/entities/startup";
import { StartupSettingsForm } from "~/features/edit-startup";
import { useDiscardGuard } from "~/shared/lib/useDiscardGuard";
import { DiscardChangesDialog } from "~/shared/ui/DiscardChangesDialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/shared/ui/sheet";
import { Spinner } from "~/shared/ui/spinner";
import { TeamSection } from "./TeamSection";

/** A Startup's Team & settings, in a side sheet over whichever tab is open: the Team, then the Founder's details form. */
export function SettingsSheet({
	slug,
	open,
	onOpenChange,
}: {
	readonly slug: string;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
}) {
	const found = useStartup(open ? slug : undefined);
	const guard = useDiscardGuard(onOpenChange);
	const isFounder = found?.role === "founder";

	return (
		<>
			<Sheet open={open} onOpenChange={guard.guardedOpenChange}>
				<SheetContent className="overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Team &amp; settings</SheetTitle>
						<SheetDescription>
							{isFounder
								? "Your Startup's page and its team."
								: "Who's on this Startup."}
						</SheetDescription>
					</SheetHeader>
					{found === undefined ? (
						<div className="flex justify-center py-6">
							<Spinner />
						</div>
					) : found ? (
						<div className="flex flex-col gap-8 pb-6">
							<div className="px-4">
								<TeamSection
									startupId={found.startup._id}
									isFounder={isFounder}
									isOwner={found.isOwner}
								/>
							</div>
							{isFounder ? (
								<StartupSettingsForm
									startup={found.startup}
									onChangedChange={guard.setIsChanged}
									onSaved={() => onOpenChange(false)}
								/>
							) : null}
						</div>
					) : null}
				</SheetContent>
			</Sheet>
			<DiscardChangesDialog
				open={guard.isAsking}
				onKeepEditing={guard.keepEditing}
				onDiscard={guard.discard}
			/>
		</>
	);
}
