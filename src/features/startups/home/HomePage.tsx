import { useState } from "react";
import { EmptyState } from "~/components/shared/EmptyState";
import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { Row, RowList } from "~/components/shared/RowList";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { useMyStartups } from "./hooks/useMyStartups";
import { NewStartupForm } from "./NewStartupForm";

export function HomePage() {
	const startups = useMyStartups();
	const [isCreating, setIsCreating] = useState(false);
	const newStartup = (
		<Button onClick={() => setIsCreating(true)}>New startup</Button>
	);

	return (
		<>
			<PageHeader title="Your startups" actions={newStartup} />
			<Page>
				{startups === undefined ? null : startups.length === 0 ? (
					<EmptyState
						title="Start one. Run your first Cycle."
						action={newStartup}
					/>
				) : (
					<RowList>
						{startups.map((startup) => (
							<Row
								key={startup.startupId}
								title={startup.name}
								meta={startup.role === "founder" ? "Founder" : "Contributor"}
								to="/s/$slug/board"
								params={{ slug: startup.slug }}
							/>
						))}
					</RowList>
				)}
			</Page>
			<Dialog open={isCreating} onOpenChange={setIsCreating}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New startup</DialogTitle>
					</DialogHeader>
					<NewStartupForm />
				</DialogContent>
			</Dialog>
		</>
	);
}
