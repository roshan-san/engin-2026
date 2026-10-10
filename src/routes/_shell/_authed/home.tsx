import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "~/components/shared/EmptyState";
import { Page } from "~/components/shared/Page";

export const Route = createFileRoute("/_shell/_authed/home")({
	component: HomePage,
});

function HomePage() {
	return (
		<Page>
			<EmptyState title="Engin is being rebuilt." body="Back soon." />
		</Page>
	);
}
