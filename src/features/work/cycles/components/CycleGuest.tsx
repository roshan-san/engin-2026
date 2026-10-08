import { Page } from "~/components/shared/Page";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "~/components/shared/PageHeader";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import { useMyWork } from "~/features/work/cycles/hooks/useMyWork";

export function CycleGuest() {
	const { tasks, applications, isLoading } = useMyWork();
	const hackathons =
		applications?.filter(
			(item) => item.hackathonId !== null && item.status === "accepted",
		) ?? [];
	const activeTasks =
		tasks?.filter((task) => task.status === "in_progress") ?? [];

	return (
		<>
			<PageHeader
				width="wide"
				title="You're not on a startup yet"
				meta="Join a Hackathon to prove work, or create a Startup and run Build from the inside."
			/>
			<Page className="space-y-8">
				{isLoading ? (
					<p className="text-sm text-muted-foreground">Loading your work…</p>
				) : null}

				{hackathons.length > 0 ? (
					<section className="space-y-2">
						<SectionLabel>Hackathons</SectionLabel>
						<RowList>
							{hackathons.map((item) => {
								const hackathonId = item.hackathonId;
								if (!hackathonId) {
									return null;
								}
								return (
									<Row
										key={item._id}
										to="/s/$slug/hackathons/$hackathonId"
										params={{ slug: item.startupSlug, hackathonId }}
										title={item.hackathonTitle}
										meta={item.startupName}
									/>
								);
							})}
						</RowList>
					</section>
				) : null}

				{activeTasks.length > 0 ? (
					<section className="space-y-2">
						<SectionLabel>Your Tasks</SectionLabel>
						<RowList>
							{activeTasks.map((task) => (
								<Row
									key={task._id}
									title={task.title}
									meta={task.startupName}
								/>
							))}
						</RowList>
					</section>
				) : null}

				<div className="flex flex-col gap-2 sm:flex-row">
					<Button asChild className="h-11">
						<Link to="/explore/hackathons">Find a Hackathon</Link>
					</Button>
					<Button asChild variant="ghost" className="h-11">
						<Link to="/startups/new">Create a Startup</Link>
					</Button>
				</div>
			</Page>
		</>
	);
}
