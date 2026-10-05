import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { PulseBoard } from "~/features/work/pulses/components/PulseBoard";

type ParticipantBoardSheetProps = {
	readonly startupId: Id<"startups">;
	readonly trialCycleId: Id<"trialCycles">;
	readonly participant: { userId: Id<"users">; name: string };
};

/** A Founder's read-only look at one Participant's Board, to judge the work. */
export function ParticipantBoardSheet({
	startupId,
	trialCycleId,
	participant,
}: ParticipantBoardSheetProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				type="button"
				size="sm"
				variant="outline"
				onClick={() => setIsOpen(true)}
			>
				View board
			</Button>
			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetContent
					side="right"
					className="w-full overflow-y-auto sm:max-w-3xl"
				>
					<SheetHeader>
						<SheetTitle>Trial Board</SheetTitle>
						<SheetDescription>
							Read-only. Only {participant.name} can change their Board.
						</SheetDescription>
					</SheetHeader>
					{isOpen ? (
						<div className="px-4 pb-6">
							<PulseBoard
								startupId={startupId}
								trialCycleId={trialCycleId}
								hasStarted
								isEditable={false}
								participant={participant}
							/>
						</div>
					) : null}
				</SheetContent>
			</Sheet>
		</>
	);
}
