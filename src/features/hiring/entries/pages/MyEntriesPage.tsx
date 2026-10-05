import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import {
	type Entry,
	EntryRow,
} from "~/features/hiring/entries/components/EntryRow";
import { useMyEntries } from "~/features/hiring/entries/hooks/useMyEntries";
import { PendingOffers } from "~/features/hiring/offers/components/PendingOffers";

/** Every hackathon the contributor applied to: live ones first, then the rest. */
export function MyEntriesPage() {
	const { entries, live, past } = useMyEntries();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<h1 className="text-xl font-semibold">My Entries</h1>
			<PendingOffers />
			{entries === undefined ? (
				<PageLoading rows={3} />
			) : entries.length === 0 ? (
				<EmptyState
					title="No entries yet"
					description="Hackathons you apply to show up here, with where each one stands."
					action={
						<Button asChild size="sm">
							<Link to="/discover">Find a hackathon</Link>
						</Button>
					}
				/>
			) : (
				<>
					<EntryGroup
						heading="Live"
						entries={live}
						empty="No live entries. Hackathons you're applying to or taking part in show up here."
					/>
					{past.length > 0 ? (
						<EntryGroup heading="Past" entries={past} />
					) : null}
				</>
			)}
		</div>
	);
}

type EntryGroupProps = {
	readonly heading: string;
	readonly entries: Entry[];
	readonly empty?: string;
};

function EntryGroup({ heading, entries, empty }: EntryGroupProps) {
	return (
		<section className="space-y-3">
			<h2 className="text-sm font-medium text-muted-foreground">{heading}</h2>
			{entries.length === 0 ? (
				<p className="text-sm text-muted-foreground">{empty}</p>
			) : (
				<ul className="space-y-2">
					{entries.map((entry) => (
						<EntryRow key={entry._id} entry={entry} />
					))}
				</ul>
			)}
		</section>
	);
}
