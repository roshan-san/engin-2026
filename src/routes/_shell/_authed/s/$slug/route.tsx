import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StartupGate } from "~/features/work/board/StartupGate";

export const Route = createFileRoute("/_shell/_authed/s/$slug")({
	component: StartupLayout,
});

function StartupLayout() {
	const { slug } = Route.useParams();

	return (
		<StartupGate slug={slug}>
			<Outlet />
		</StartupGate>
	);
}
