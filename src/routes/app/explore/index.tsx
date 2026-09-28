import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "~/features/discover/pages/DiscoverPage";

export const Route = createFileRoute("/app/explore/")({
	component: () => <DiscoverPage />,
});
