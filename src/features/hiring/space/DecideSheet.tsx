import type { Doc } from "@convex/_generated/dataModel";
import { TEXT } from "@convex/lib/limits";
import { StarIcon } from "lucide-react";
import { useState } from "react";
import { MentorNote } from "~/components/shared/MentorNote";
import { SectionLabel } from "~/components/shared/SectionLabel";
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
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { dayLabel } from "../hackathonDates";
import type { ApplicantRow } from "./applicantSort";
import { decideState } from "./decideSteps";
import { useDecide } from "./hooks/useDecide";

type Decision = "hired" | "not_this_time";

/** ★ Shortlist, then the Walkthrough, then Hired or Not this time. */
export function DecideSheet({
	row,
	hackathon,
}: {
	readonly row: ApplicantRow;
	readonly hackathon: Doc<"hackathons">;
}) {
	const { application, user } = row;
	const { shortlist, markWalkthrough, decide } = useDecide(application._id);
	const [notes, setNotes] = useState("");
	const [feedback, setFeedback] = useState("");
	const [confirming, setConfirming] = useState<Decision | null>(null);
	const state = decideState(application, hackathon, Date.now());
	const name = user.name ?? user.username ?? "them";

	if (state.decided) {
		return (
			<div className="flex flex-col gap-2 p-4">
				<SectionLabel as="h3">Decision</SectionLabel>
				<p className="text-sm">
					<span className="font-medium">
						{state.decided === "hired" ? "Hired" : "Not this time"}
					</span>
					{application.feedback ? ` · ${application.feedback}` : null}
				</p>
				<WalkthroughNotes application={application} />
			</div>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-4">
			<section className="flex flex-col gap-2">
				<SectionLabel as="h3">1 · Shortlist</SectionLabel>
				<Button
					variant={application.shortlisted ? "default" : "outline"}
					className="self-start"
					disabled={!state.canShortlist}
					aria-pressed={application.shortlisted}
					onClick={() => void shortlist(!application.shortlisted)}
				>
					<StarIcon
						className={application.shortlisted ? "fill-current" : undefined}
					/>
					{application.shortlisted ? "Shortlisted" : "Shortlist"}
				</Button>
			</section>

			<section className="flex flex-col gap-2">
				<SectionLabel as="h3">2 · Walkthrough</SectionLabel>
				{application.walkthroughAt !== null ? (
					<WalkthroughNotes application={application} />
				) : application.shortlisted ? (
					<>
						<Textarea
							aria-label="Walkthrough notes"
							placeholder="Notes"
							value={notes}
							maxLength={TEXT.walkthroughNotes}
							className="min-h-20"
							onChange={(e) => setNotes(e.target.value)}
						/>
						<MentorNote>Private. What you learned on the call.</MentorNote>
						<Button
							variant="outline"
							className="self-start"
							disabled={!state.canWalkthrough}
							onClick={() => void markWalkthrough(notes)}
						>
							Walkthrough done
						</Button>
					</>
				) : (
					<MentorNote>
						Shortlist first. Send a call link in the thread.
					</MentorNote>
				)}
			</section>

			<section className="flex flex-col gap-2">
				<SectionLabel as="h3">3 · Decide</SectionLabel>
				{state.canDecide ? (
					<>
						<Input
							aria-label="Note for them"
							placeholder="One line for them"
							value={feedback}
							maxLength={TEXT.feedback}
							onChange={(e) => setFeedback(e.target.value)}
						/>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								disabled={!state.canHire}
								onClick={() => setConfirming("hired")}
							>
								Hired
							</Button>
							<Button
								variant="outline"
								onClick={() => setConfirming("not_this_time")}
							>
								Not this time
							</Button>
							{state.hireHint ? (
								<MentorNote>{state.hireHint}</MentorNote>
							) : null}
						</div>
					</>
				) : (
					<MentorNote>
						{hackathon.status === "done"
							? "This Hackathon has ended."
							: "Decide after it ends."}
					</MentorNote>
				)}
			</section>

			<AlertDialog
				open={confirming !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen) setConfirming(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirming === "hired"
								? `Hire ${name}?`
								: `Tell ${name} not this time?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirming === "hired"
								? "They get an Invite to join."
								: "They see your note."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (confirming) void decide(confirming, feedback);
							}}
						>
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function WalkthroughNotes({
	application,
}: {
	readonly application: ApplicantRow["application"];
}) {
	if (application.walkthroughAt === null) return null;
	return (
		<div className="flex flex-col gap-1">
			<p className="text-sm">
				Walkthrough done · {dayLabel(application.walkthroughAt)}
			</p>
			{application.walkthroughNotes ? (
				<p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
					{application.walkthroughNotes}
				</p>
			) : null}
		</div>
	);
}
