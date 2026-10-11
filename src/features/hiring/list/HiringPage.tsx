import { Link } from "@tanstack/react-router";
import { EmptyState } from "~/components/shared/EmptyState";
import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { HackathonRow } from "./HackathonRow";
import { groupHackathons, type HiringRow } from "./hiringGroups";
import { useHackathons } from "./hooks/useHackathons";

/** The Startup's Hackathons: Now, Drafts (Founder only) and Past. */
export function HiringPage() {
	const { startup, isFounder } = useWorkspace();
	const rows = useHackathons(startup._id);
	const newHackathon = isFounder ? (
		<Button asChild>
			<Link to="/s/$slug/hiring/new" params={{ slug: startup.slug }}>
				New hackathon
			</Link>
		</Button>
	) : null;
	const hasRows = rows !== undefined && rows.length > 0;

	return (
		<>
			<PageHeader
				title="Hiring"
				width="narrow"
				actions={hasRows ? newHackathon : null}
			/>
			<Page width="narrow">
				{rows === undefined ? (
					<div className="flex flex-col gap-3">
						<Skeleton className="h-12" />
						<Skeleton className="h-12" />
					</div>
				) : rows.length === 0 ? (
					<EmptyState
						title={
							isFounder
								? "Hire by watching people build."
								: "No hackathons yet."
						}
						action={newHackathon}
					/>
				) : (
					<Groups rows={rows} slug={startup.slug} isFounder={isFounder} />
				)}
			</Page>
		</>
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
		<div className="flex flex-col gap-8">
			{sections.map((section) => (
				<section key={section.label} className="flex flex-col gap-1">
					<SectionLabel>{section.label}</SectionLabel>
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
				</section>
			))}
		</div>
	);
}
