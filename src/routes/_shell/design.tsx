import { createFileRoute, redirect } from "@tanstack/react-router";
import { DesignPage } from "~/features/design/pages/DesignPage";

/** Dev-only: the component gallery. Production builds redirect home. */
export const Route = createFileRoute("/_shell/design")({
	beforeLoad: () => {
		if (!import.meta.env.DEV) throw redirect({ to: "/" });
	},
	component: DesignPage,
});
