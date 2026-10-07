import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { GlowHero } from "~/components/shared/GlowHero";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DeclineOfferDialog } from "~/features/hiring/offers/components/DeclineOfferDialog";
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
		<GlowHero
			titleAs="h2"
			eyebrow={<SectionLabel as="p">Your Verdict</SectionLabel>}
			title={verdictLabel(verdict)}
			subtitle={
				<span className="break-words">
					{startupName} · {roleTitle}
				</span>
			}
		>
			<div className="space-y-5">
				{evaluation ? (
					<div className="space-y-3">
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
					</div>
				) : null}

				{offer?.status === "pending" ? (
					<div className="space-y-3">
						<p className="text-base break-words">
							<span className="font-medium">{startupName}</span> offered you the{" "}
							{roleTitle} Role.
						</p>
						<div className="flex gap-2">
							<Button
								type="button"
								disabled={isAnswering}
								onClick={() => void offers.accept(offer._id)}
							>
								Accept
							</Button>
							<Button
								type="button"
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
						<Badge
							variant={offer.status === "accepted" ? "default" : "outline"}
						>
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
			</div>

			<DeclineOfferDialog
				startupName={isDeclining ? startupName : null}
				isPending={isAnswering}
				onCancel={() => setIsDeclining(false)}
				onConfirm={() => void decline()}
			/>
		</GlowHero>
	);
}
