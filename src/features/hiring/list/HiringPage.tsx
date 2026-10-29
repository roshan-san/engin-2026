import { Link } from "@tanstack/react-router";
import { useWorkspace } from "~/entities/startup";
import { AppPage, PageTitle } from "~/shared/ui/AppPage";
import { Button } from "~/shared/ui/button";
import { EmptyState } from "~/shared/ui/EmptyState";
import { RowList } from "~/shared/ui/RowList";
import { Section } from "~/shared/ui/Section";
import { Skeleton } from "~/shared/ui/skeleton";
import { HackathonRow } from "./HackathonRow";
import { groupHackathons, type HiringRow, hiringSummary } from "./hiringGroups";
import { useHackathons } from "./useHackathons";

/** The Startup's Hackathons: Now, Drafts (Founder only) and Past. */
export function HiringPage() {
	const { startup, isFounder } = useWorkspace();
	const rows = useHackathons(startup._id);
	const newHackathon = isFounder ? (
		<Button asChild size="sm">
			<Link to="/s/$slug/hiring/new" params={{ slug: startup.slug }}>
				New hackathon
			</Link>
		</Button>
	) : null;
	const hasRows = rows !== undefined && rows.length > 0;

	return (
		<AppPage
			bar={{
				title: (
					<PageTitle
						name="Hiring"
						context={rows ? hiringSummary(rows, isFounder) : null}
					/>
				),
				actions: hasRows ? newHackathon : null,
			}}
		>
			{rows === undefined ? (
				<div className="flex flex-col gap-3">
					<Skeleton className="h-12" />
					<Skeleton className="h-12" />
				</div>
			) : rows.length === 0 ? (
				<EmptyState
					title={
						isFounder ? "Hire by watching people build." : "No hackathons yet."
					}
					body={
						isFounder
							? "Post a real problem. Up to 10 Participants work it for a week on their own Boards. Hire on what they ship."
							: null
					}
					action={newHackathon}
				/>
			) : (
				<Groups rows={rows} slug={startup.slug} isFounder={isFounder} />
			)}
		</AppPage>
	);
}

function Groups({
	rows,
	slug,
	isFounder,
}: {
	readonly rows: HiringRow[];
	readonly slug: string;
	readonly isFounder: boolean;
}) {
	const groups = groupHackathons(rows, isFounder);
	const sections = [
		{ label: "Now", rows: groups.now },
		{ label: "Drafts", rows: groups.drafts },
		{ label: "Past", rows: groups.past },
	].filter((section) => section.rows.length > 0);

	return (
		<div className="flex flex-col gap-10">
			{sections.map((section) => (
				<Section key={section.label} label={section.label}>
					<RowList>
						{section.rows.map((row) => (
							<HackathonRow
								key={row._id}
								row={row}
								slug={slug}
								isFounder={isFounder}
							/>
						))}
					</RowList>
				</Section>
			))}
		</div>
	);
}
