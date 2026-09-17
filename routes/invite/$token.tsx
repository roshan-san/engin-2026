import { createFileRoute } from "@tanstack/react-router";
import { InviteAcceptPage } from "~/features/team/ui/InviteAcceptPage";

export const Route = createFileRoute("/invite/$token")({
	component: InviteAcceptRoute,
});

function InviteAcceptRoute() {
	const { token } = Route.useParams();
	return <InviteAcceptPage token={token} />;
}
