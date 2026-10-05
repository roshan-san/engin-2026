import { Link } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import type {
	MyPulse,
	PulseToReview,
} from "~/features/work/pulses/hooks/useMyPulses";
import { PULSE_STATUSES } from "~/features/work/pulses/constants";

function statusLabel(status: MyPulse["status"]): string {
	return PULSE_STATUSES.find((item) => item.value === status)?.label ?? status;
}

/** One of the viewer's Pulses, linking to the Cycle or Trial Cycle it lives on. */
export function MyPulseRow({ pulse }: { readonly pulse: MyPulse }) {
	const { place } = pulse;
	const where = `${pulse.startupName} · ${place.title}`;
	const proofCount = pulse.proofLinks.length;

	return (
		<li>
			<Link
				{...(place.kind === "cycle"
					? {
							to: "/s/$slug/cycles/$cycleId",
							params: { slug: pulse.startupSlug, cycleId: place.cycleId },
						}
					: {
							to: "/s/$slug/trials/$trialCycleId",
							params: {
								slug: pulse.startupSlug,
								trialCycleId: place.trialCycleId,
							},
						})}
				className="block space-y-1 rounded-lg border p-4 hover:bg-muted/30"
			>
				<div className="flex items-start justify-between gap-3">
					<p className="min-w-0 font-medium break-words">{pulse.title}</p>
					<Badge variant="outline" className="shrink-0">
						{statusLabel(pulse.status)}
					</Badge>
				</div>
				<p className="text-sm break-words text-muted-foreground">
					{where}
					{place.kind === "trial" ? " (hackathon)" : null}
					{proofCount > 0
						? ` · ${proofCount} proof ${proofCount === 1 ? "link" : "links"}`
						: null}
				</p>
				{pulse.reviewNote && pulse.status === "in_progress" ? (
					<p className="text-sm break-words text-destructive">
						Sent back: {pulse.reviewNote}
					</p>
				) : null}
			</Link>
		</li>
	);
}

/** A Pulse awaiting the viewer's review, linking to its Cycle board. */
export function ReviewRow({ pulse }: { readonly pulse: PulseToReview }) {
	const assignee =
		pulse.assignee?.name ?? pulse.assignee?.username ?? "Unassigned";
	return (
		<li>
			<Link
				to="/s/$slug/cycles/$cycleId"
				params={{ slug: pulse.startupSlug, cycleId: pulse.cycleId }}
				className="block space-y-1 rounded-lg border p-4 hover:bg-muted/30"
			>
				<p className="font-medium break-words">{pulse.title}</p>
				<p className="text-sm break-words text-muted-foreground">
					{assignee} · {pulse.startupName} · {pulse.cycleTitle}
				</p>
			</Link>
		</li>
	);
}
