import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import {
	MyPulseRow,
	ReviewRow,
} from "~/features/work/pulses/components/MyPulseRow";
import {
	type MyPulse,
	useMyPulses,
} from "~/features/work/pulses/hooks/useMyPulses";

/** Where sign-in lands: the viewer's Pulses across every Startup and hackathon. */
export function MyPulsesPage() {
	const { pulses, toReview, open, inReview, done } = useMyPulses();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<h1 className="text-xl font-semibold">My Pulses</h1>
			{toReview && toReview.length > 0 ? (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Awaiting your review · {toReview.length}
					</h2>
					<ul className="space-y-2">
						{toReview.map((pulse) => (
							<ReviewRow key={pulse._id} pulse={pulse} />
						))}
					</ul>
				</section>
			) : null}
			{pulses === undefined ? (
				<PageLoading rows={3} />
			) : pulses.length === 0 ? (
				<EmptyState
					title="No Pulses yet"
					description="Pulses you take on a Cycle or work on a hackathon Board show up here."
					action={
						<Button asChild size="sm">
							<Link to="/discover">Find a hackathon</Link>
						</Button>
					}
				/>
			) : (
				<>
					<PulseGroup
						heading="Open"
						pulses={open}
						empty="Nothing open. Take a Pulse on a Cycle to get going."
					/>
					{inReview.length > 0 ? (
						<PulseGroup heading="In review" pulses={inReview} />
					) : null}
					{done.length > 0 ? <PulseGroup heading="Done" pulses={done} /> : null}
				</>
			)}
		</div>
	);
}

type PulseGroupProps = {
	readonly heading: string;
	readonly pulses: MyPulse[];
	readonly empty?: string;
};

function PulseGroup({ heading, pulses, empty }: PulseGroupProps) {
	return (
		<section className="space-y-3">
			<h2 className="text-sm font-medium text-muted-foreground">
				{heading} · {pulses.length}
			</h2>
			{pulses.length === 0 ? (
				<p className="text-sm text-muted-foreground">{empty}</p>
			) : (
				<ul className="space-y-2">
					{pulses.map((pulse) => (
						<MyPulseRow key={pulse._id} pulse={pulse} />
					))}
				</ul>
			)}
		</section>
	);
}
