import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { FieldError } from "~/components/ui/field";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { useCredits } from "~/features/hiring/screen/hooks/useCredits";
import {
	type TrialScheduleValue,
	TrialScheduleFields,
} from "~/features/hiring/trialCycles/components/TrialScheduleFields";
import {
	FOUNDER_IP_TERMS,
	HACKATHON_PRICE_LABELS,
	PRO_PRICE_LABEL,
} from "~/features/hiring/trialCycles/constants";
import { usePublishHackathon } from "~/features/hiring/trialCycles/hooks/usePublishHackathon";

type PublishDialogProps = {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly slug: string;
	readonly trialCycleId: Id<"trialCycles">;
	readonly title: string;
	/** The draft's saved dates, shown when they need replacing. */
	readonly schedule: TrialScheduleValue;
	readonly onPublished: () => void;
};

/** One dialog for every publish path: a credit, a payment, or a fix first. */
export function PublishDialog({
	open,
	onOpenChange,
	slug,
	trialCycleId,
	title,
	schedule: savedSchedule,
	onPublished,
}: PublishDialogProps) {
	const [acceptTerms, setAcceptTerms] = useState(false);
	const [schedule, setSchedule] = useState(savedSchedule);
	const { count, onlyFreeCredit } = useCredits(true);
	const {
		error,
		fix,
		isPending,
		isPro,
		publish,
		pay,
		saveDates,
		goPro,
		isUpgrading,
	} = usePublishHackathon({ slug, trialCycleId, onPublished });

	const hasCredit = count !== undefined && count > 0;
	const isBusy = isPending || isUpgrading;
	const canSubmit = acceptTerms && count !== undefined && !isBusy;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Publish “{title}”</DialogTitle>
					<DialogDescription>
						It goes public on Discover and opens for applications. After
						publishing, only its Starting Pulses can change.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-start gap-3 rounded-lg border p-3">
					<Checkbox
						id="publish-ip-terms"
						checked={acceptTerms}
						onCheckedChange={(checked) => setAcceptTerms(checked === true)}
						disabled={isBusy}
						className="mt-0.5"
					/>
					<Label
						htmlFor="publish-ip-terms"
						className="text-sm leading-snug font-normal"
					>
						{FOUNDER_IP_TERMS}
					</Label>
				</div>

				{error ? (
					<div className="space-y-3">
						<FieldError>{error}</FieldError>
						{fix === "dates" ? (
							<div className="space-y-3">
								<TrialScheduleFields
									idPrefix="publish"
									value={schedule}
									onChange={setSchedule}
									disabled={isPending}
								/>
								<Button
									type="button"
									variant="outline"
									disabled={isPending}
									onClick={() => void saveDates(schedule)}
								>
									Save dates
								</Button>
							</div>
						) : null}
						{fix === "edit" ? (
							<Button asChild variant="outline">
								<Link
									to="/s/$slug/hiring/$trialCycleId/edit"
									params={{ slug, trialCycleId }}
									onClick={() => onOpenChange(false)}
								>
									Add Starting Pulses
								</Link>
							</Button>
						) : null}
					</div>
				) : null}

				<DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
					{hasCredit ? (
						<Button
							type="button"
							disabled={!canSubmit || fix === "dates"}
							onClick={() => void publish()}
							className="h-11"
						>
							{isPending ? <Spinner /> : null}
							{onlyFreeCredit
								? "Publish, uses your free credit"
								: `Publish (uses 1 credit, ${count - 1} left)`}
						</Button>
					) : (
						<>
							<Button
								type="button"
								disabled={!canSubmit || fix === "dates"}
								onClick={() => void pay()}
								className="h-11"
							>
								{isPending ? <Spinner /> : null}
								Pay {HACKATHON_PRICE_LABELS[isPro ? "pro" : "free"]}
							</Button>
							{isPro ? null : (
								<Button
									type="button"
									variant="ghost"
									disabled={isBusy}
									onClick={goPro}
									className="h-auto whitespace-normal py-2"
								>
									or go Pro, {PRO_PRICE_LABEL}: 2 hackathons a month included +
									a bigger workspace
								</Button>
							)}
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
