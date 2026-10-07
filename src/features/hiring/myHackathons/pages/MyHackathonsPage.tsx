import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import {
	type Entry,
	MyHackathonRow,
} from "~/features/hiring/myHackathons/components/MyHackathonRow";
import { useMyHackathons } from "~/features/hiring/myHackathons/hooks/useMyHackathons";
import { PendingOffers } from "~/features/hiring/offers/components/PendingOffers";

/** Every hackathon the contributor applied to: live ones first, then the rest. */
export function MyHackathonsPage() {
	const { entries, live, past } = useMyHackathons();

	return (
		<div className="mx-auto w-full max-w-5xl space-y-8">
			<PageHeader hidden title="My Hackathons" />
			<PendingOffers />
			{entries === undefined ? (
				<PageLoading rows={3} />
			) : entries.length === 0 ? (
				<EmptyState
					title="No Hackathons yet"
					body="Hackathons you apply to show up here, with where each one stands."
					action={
						<Button asChild size="sm">
							<Link to="/explore/hackathons">Find a Hackathon</Link>
						</Button>
					}
				/>
			) : (
				<>
					<MyHackathonGroup
						heading="Live"
						entries={live}
						empty="No live hackathons. Hackathons you're applying to or taking part in show up here."
					/>
					{past.length > 0 ? (
						<MyHackathonGroup heading="Past" entries={past} />
					) : null}
				</>
			)}
		</div>
	);
}

type MyHackathonGroupProps = {
	readonly heading: string;
	readonly entries: Entry[];
	readonly empty?: string;
};

function MyHackathonGroup({ heading, entries, empty }: MyHackathonGroupProps) {
	return (
		<section className="space-y-2">
			<SectionLabel>{heading}</SectionLabel>
			{entries.length === 0 ? (
				<p className="text-sm text-muted-foreground">{empty}</p>
			) : (
				<RowList>
					{entries.map((entry) => (
						<MyHackathonRow key={entry._id} entry={entry} />
					))}
				</RowList>
			)}
		</section>
	);
}
