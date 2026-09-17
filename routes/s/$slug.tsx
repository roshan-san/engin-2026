import { createFileRoute } from "@tanstack/react-router";
import { PublicPitchPage } from "~/features/pitch/ui/PublicPitchPage";

export const Route = createFileRoute("/s/$slug")({
	component: PublicPitchRoute,
});

function PublicPitchRoute() {
	const { slug } = Route.useParams();
	return <PublicPitchPage slug={slug} />;
}
