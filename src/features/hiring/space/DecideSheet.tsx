import type { Doc } from "@convex/_generated/dataModel";
import { TEXT } from "@convex/shared/limits";
import { CheckIcon, StarIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { MentorNote } from "~/components/MentorNote";
import { Section } from "~/components/Section";
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
import { cn } from "~/shared/lib/cn";
import { dayLabel } from "~/shared/lib/dates";
import { lastDay } from "~/shared/lib/hackathonDates";
import type { ApplicantRow } from "./applicantSort";
import { decideState } from "./decideSteps";
import { useDecide } from "./useDecide";

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
	const firstName = name.split(/\s+/)[0];
	const note = feedback.trim();

	if (state.decided) {
		return (
			<Section label="Decision" as="h3" className="p-4">
				<p className="text-sm">
					<span className="font-medium">
						{state.decided === "hired" ? "Hired" : "Not this time"}
					</span>
					{application.feedback ? ` · ${application.feedback}` : null}
				</p>
				<WalkthroughNotes application={application} />
			</Section>
		);
	}

	const walkthroughStep = application.walkthroughAt
		? "done"
		: application.shortlisted
			? "current"
			: "later";

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
			<ol className="flex flex-col">
				<Step
					number={1}
					title="Shortlist"
					state={application.shortlisted ? "done" : "current"}
				>
					<Button
						variant={application.shortlisted ? "secondary" : "outline"}
						size="sm"
						className="self-start"
						disabled={!state.canShortlist}
						aria-pressed={application.shortlisted}
						onClick={() => void shortlist(!application.shortlisted)}
					>
						<StarIcon
							className={
								application.shortlisted
									? "fill-current text-warning"
									: undefined
							}
						/>
						{application.shortlisted ? "Shortlisted" : "Shortlist"}
					</Button>
				</Step>

				<Step number={2} title="Walkthrough" state={walkthroughStep}>
					{application.walkthroughAt !== null ? (
						<WalkthroughNotes application={application} />
					) : application.shortlisted ? (
						<>
							<MentorNote>
								Send a call link in the thread. Notes are private.
							</MentorNote>
							<Textarea
								aria-label="Walkthrough notes"
								placeholder="What you learned on the call"
								value={notes}
								maxLength={TEXT.walkthroughNotes}
								className="min-h-20"
								onChange={(e) => setNotes(e.target.value)}
							/>
							<Button
								variant="outline"
								size="sm"
								className="self-start"
								disabled={!state.canWalkthrough}
								onClick={() => void markWalkthrough(notes)}
							>
								Walkthrough done
							</Button>
						</>
					) : (
						<MentorNote>Shortlist first.</MentorNote>
					)}
				</Step>

				<Step
					number={3}
					title="Decide"
					isLast
					state={state.canDecide ? "current" : "later"}
				>
					{state.canDecide ? (
						<>
							<MentorNote>
								Due {dayLabel(lastDay(hackathon.decideBy))}. They see your note.
								Anyone left undecided by then stays undecided.
							</MentorNote>
							<Input
								aria-label="Note for them"
								placeholder="One line for them"
								value={feedback}
								maxLength={TEXT.feedback}
								onChange={(e) => setFeedback(e.target.value)}
							/>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									size="sm"
									disabled={!state.canHire}
									onClick={() => setConfirming("hired")}
								>
									Hired
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setConfirming("not_this_time")}
								>
									Not this time
								</Button>
							</div>
							{state.hireHint ? (
								<MentorNote>{state.hireHint}</MentorNote>
							) : null}
						</>
					) : (
						<MentorNote>
							{hackathon.status === "done"
								? "This Hackathon has ended."
								: `Decide from ${dayLabel(hackathon.endsAt)}.`}
						</MentorNote>
					)}
				</Step>
			</ol>

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
						<AlertDialogDescription className="flex flex-col gap-1">
							<span>
								{confirming === "hired"
									? "They get an Invite to join."
									: "They see your note."}
							</span>
							<span className="break-words">
								{note ? `Your note: “${note}”` : "No note"}
							</span>
							<span>This can't be changed.</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (confirming) void decide(confirming, feedback);
							}}
						>
							{confirming === "hired"
								? `Hire ${firstName}`
								: "Send Not this time"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

/** One step of the decision: a check once done, the next one lit, the rest quiet. */
function Step({
	number,
	title,
	state,
	isLast = false,
	children,
}: {
	readonly number: number;
	readonly isLast?: boolean;
	readonly title: string;
	readonly state: "done" | "current" | "later";
	readonly children: ReactNode;
}) {
	return (
		<li className="relative flex gap-3 pb-7 last:pb-0">
			{isLast ? null : (
				<span
					aria-hidden
					className="absolute top-7 bottom-1 left-[11px] w-px bg-border"
				/>
			)}
			<span
				className={cn(
					"flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
					state === "done" && "border-success/40 bg-success/15 text-success",
					state === "current" && "border-foreground text-foreground",
					state === "later" && "border-border text-subtle-foreground",
				)}
			>
				{state === "done" ? <CheckIcon className="size-3.5" /> : number}
				<span className="sr-only">
					{state === "done" ? "Done" : state === "current" ? "Next" : "Later"}
				</span>
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-0.5">
				<h3
					className={cn(
						"text-sm font-medium",
						state === "later" && "text-muted-foreground",
					)}
				>
					{title}
				</h3>
				{children}
			</div>
		</li>
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
