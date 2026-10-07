import { createFileRoute } from "@tanstack/react-router";
import { HackathonPage } from "~/features/hiring/hackathons/pages/HackathonPage";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/hackathons/$hackathonId",
)({
	component: HackathonRoute,
});

function HackathonRoute() {
	const { slug, hackathonId } = Route.useParams();
	return <HackathonPage slug={slug} hackathonId={hackathonId} />;
}
