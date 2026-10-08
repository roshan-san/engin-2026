import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseDesignSystem } from "~/features/design/systems";
import { DesignPage } from "~/features/design/pages/DesignPage";

/** Dev-only: the design-system picker. Production builds redirect home. */
export const Route = createFileRoute("/_shell/design")({
	validateSearch: (search: Record<string, unknown>) => ({
		system: parseDesignSystem(search.system),
	}),
	beforeLoad: () => {
		if (!import.meta.env.DEV) throw redirect({ to: "/" });
	},
	component: DesignRoute,
});

function DesignRoute() {
	const { system } = Route.useSearch();
	return <DesignPage system={system} />;
}
