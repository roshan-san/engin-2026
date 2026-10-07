import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useRespondToOffer } from "~/features/hiring/offers/hooks/useRespondToOffer";
import {
	OFFER_STATUS_LABELS,
	type OfferStatus,
	type Verdict,
	verdictLabel,
} from "~/features/hiring/hackathons/constants";
import { useEvaluationVisibility } from "~/features/hiring/hackathons/hooks/useEvaluationVisibility";

type MyVerdictProps = {
	readonly applicationId: Id<"applications">;
	readonly verdict: Verdict;
	readonly evaluation: string | null;
	readonly isEvaluationPublic: boolean;
	readonly offer: { _id: Id<"offers">; status: OfferStatus } | null;
	readonly startupName: string;
	readonly startupSlug: string;
	readonly roleTitle: string;
};

export function MyVerdict({
	applicationId,
	verdict,
	evaluation,
	isEvaluationPublic,
	offer,
	startupName,
	startupSlug,
	roleTitle,
}: MyVerdictProps) {
	const { setPublic, isPending } = useEvaluationVisibility(applicationId);
	const offers = useRespondToOffer();
	const [isDeclining, setIsDeclining] = useState(false);
	const isAnswering = offers.pendingId !== null;

	async function decline() {
		if (offer && (await offers.decline(offer._id))) {
			setIsDeclining(false);
		}
	}

	return (
		<section className="space-y-3 rounded-lg border p-4">
			<h2 className="text-lg font-semibold">
				Your Verdict: {verdictLabel(verdict)}
			</h2>
			{evaluation ? (
				<>
					<p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
						{evaluation}
					</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={isPending}
						onClick={() => void setPublic(!isEvaluationPublic)}
					>
						{isEvaluationPublic ? "Hide from profile" : "Show on profile"}
					</Button>
				</>
			) : null}

			{offer?.status === "pending" ? (
				<div className="flex flex-col gap-3 rounded-lg bg-muted/30 p-3 sm:flex-row sm:items-center">
					<p className="flex-1 text-sm break-words">
						<span className="font-medium">{startupName}</span> offered you the{" "}
						{roleTitle} Role.
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							size="sm"
							disabled={isAnswering}
							onClick={() => void offers.accept(offer._id)}
						>
							Accept
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isAnswering}
							onClick={() => setIsDeclining(true)}
						>
							Decline
						</Button>
					</div>
				</div>
			) : offer ? (
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant={offer.status === "accepted" ? "default" : "outline"}>
						{OFFER_STATUS_LABELS[offer.status]}
					</Badge>
					{offer.status === "accepted" ? (
						<Link
							to="/s/$slug"
							params={{ slug: startupSlug }}
							className="text-sm hover:underline"
						>
							Go to {startupName}
						</Link>
					) : null}
				</div>
			) : null}

			<AlertDialog open={isDeclining} onOpenChange={setIsDeclining}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Decline {startupName}'s offer?</AlertDialogTitle>
						<AlertDialogDescription>
							You can't accept it later. Your Verdict and its Score stay.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isAnswering}>
							Keep it
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={isAnswering}
							onClick={(event) => {
								event.preventDefault();
								void decline();
							}}
						>
							Decline offer
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
