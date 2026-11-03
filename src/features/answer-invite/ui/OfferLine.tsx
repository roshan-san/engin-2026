import type { Id } from "@convex/_generated/dataModel";
import type { OfferState } from "@convex/applications/rules";
import { Link } from "@tanstack/react-router";
import { Button } from "~/shared/ui/button";
import { useAnswerInvite } from "../api/useAnswerInvite";

type Offer = {
	readonly state: OfferState;
	readonly terms: string | null;
	readonly inviteId: Id<"invites"> | null;
};

/** "Offer from Acme: ₹20k a month." with Accept and Decline while it's open. */
export function OfferLine({
	startupName,
	slug,
	offer,
	feedback,
}: {
	readonly startupName: string;
	readonly slug: string;
	readonly offer: Offer;
	readonly feedback: string | null;
}) {
	const { answering, join, decline } = useAnswerInvite();
	const invite = offer.inviteId
		? {
				inviteId: offer.inviteId,
				startupName,
				slug,
				fromHackathon: true,
				terms: offer.terms,
			}
		: null;
	const note = feedback ? (
		<span className="text-muted-foreground"> {feedback}</span>
	) : null;

	if (offer.state === "joined") {
		return (
			<p className="min-w-0 flex-1 text-sm">
				<span className="font-medium">Joined.</span>
				{note}{" "}
				<Link
					to="/s/$slug/cycle"
					params={{ slug }}
					className="underline underline-offset-2 hover:text-foreground focus-ring"
				>
					Open {startupName}
				</Link>
				.
			</p>
		);
	}

	return (
		<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
			<p className="min-w-0 flex-1 text-sm">
				<span className="font-medium">Offer from {startupName}:</span>{" "}
				{offer.terms}
				{offer.state === "expired"
					? " · Expired. The Founder can send it again."
					: offer.state === "declined"
						? " · You declined."
						: null}
				{note}
			</p>
			{invite ? (
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						disabled={answering !== null}
						onClick={() => void decline(invite)}
					>
						Decline
					</Button>
					<Button
						size="sm"
						disabled={answering !== null}
						onClick={() => void join(invite)}
					>
						Accept and join
					</Button>
				</div>
			) : null}
		</div>
	);
}
