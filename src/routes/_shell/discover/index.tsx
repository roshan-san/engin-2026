import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "~/features/discover/pages/DiscoverPage";

export const Route = createFileRoute("/_shell/discover/")({
	component: () => <DiscoverPage />,
});
