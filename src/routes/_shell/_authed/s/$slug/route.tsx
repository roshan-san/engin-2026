import { createFileRoute } from "@tanstack/react-router";
import { StartupRouteLayout } from "~/shell/startup/StartupRoute";

export const Route = createFileRoute("/_shell/_authed/s/$slug")({
	component: StartupRoute,
});

function StartupRoute() {
	const { slug } = Route.useParams();
	return <StartupRouteLayout slug={slug} />;
}
