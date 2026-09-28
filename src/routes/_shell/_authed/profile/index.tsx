import { createFileRoute } from "@tanstack/react-router";
import { StubScreen } from "~/components/shared/StubScreen";

export const Route = createFileRoute("/_shell/_authed/profile/")({
	component: () => (
		<StubScreen
			title="Edit profile"
			emptyTitle="Profile editor coming soon"
			emptyDescription="Edit your profile details here."
		/>
	),
});
