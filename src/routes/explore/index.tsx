import { createFileRoute } from "@tanstack/react-router";
import { ExplorePage } from "~/features/explore/ui/ExplorePage";

export const Route = createFileRoute("/explore/")({
	component: () => <ExplorePage />,
});
