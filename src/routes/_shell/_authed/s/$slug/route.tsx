import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StartupGate } from "~/features/startups/workspace/StartupGate";
import { StartupBoardScope } from "~/features/work/board/StartupBoardScope";

export const Route = createFileRoute("/_shell/_authed/s/$slug")({
	component: StartupLayout,
});

function StartupLayout() {
	const { slug } = Route.useParams();

	return (
		<StartupGate slug={slug}>
			<StartupBoardScope>
				<Outlet />
			</StartupBoardScope>
		</StartupGate>
	);
}
