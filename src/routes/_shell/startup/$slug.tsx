import { createFileRoute } from "@tanstack/react-router";
import { PublicStartupPage } from "~/features/teams/startup/public/pages/PublicStartupPage";

export const Route = createFileRoute("/_shell/startup/$slug")({
	component: PublicStartupRoute,
});

function PublicStartupRoute() {
	const { slug } = Route.useParams();
	return <PublicStartupPage slug={slug} />;
}
