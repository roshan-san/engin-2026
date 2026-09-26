import { createFileRoute } from "@tanstack/react-router";
import { PublicStartupPage } from "~/features/startups/ui/PublicStartupPage";

export const Route = createFileRoute("/startup/$slug")({
	component: PublicStartupRoute,
});

function PublicStartupRoute() {
	const { slug } = Route.useParams();
	return <PublicStartupPage slug={slug} />;
}
