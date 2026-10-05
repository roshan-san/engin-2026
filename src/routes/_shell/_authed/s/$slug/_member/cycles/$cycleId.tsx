import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { CyclePage } from "~/features/work/cycles/pages/CyclePage";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/_member/cycles/$cycleId",
)({
	component: CycleRoute,
});

function CycleRoute() {
	const { slug, cycleId } = Route.useParams();
	return <CyclePage slug={slug} cycleId={cycleId as Id<"cycles">} />;
}
