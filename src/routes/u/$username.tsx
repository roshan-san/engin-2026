import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PublicProfilePage } from "~/features/profile/ui/PublicProfilePage";

export const Route = createFileRoute("/u/$username")({
	component: PublicProfileRoute,
});

function PublicProfileRoute() {
	const { username } = Route.useParams();
	const profile = useQuery(api.users.getByUsername, { username });

	return <PublicProfilePage profile={profile} />;
}
