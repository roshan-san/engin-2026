import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StartupBoardScope } from "~/app/layouts/StartupBoardScope";
import { StartupGate } from "~/app/layouts/StartupGate";

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
