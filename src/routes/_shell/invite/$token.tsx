import { createFileRoute } from "@tanstack/react-router";
import { InviteAcceptPage } from "~/features/teams/team/pages/InviteAcceptPage";

export const Route = createFileRoute("/_shell/invite/$token")({
	component: InviteAcceptRoute,
});

function InviteAcceptRoute() {
	const { token } = Route.useParams();
	return <InviteAcceptPage token={token} />;
}
