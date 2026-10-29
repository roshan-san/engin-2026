import { createRootRoute, Outlet } from "@tanstack/react-router";
import { MaintenanceGate } from "~/app/maintenance/MaintenanceGate";
import { AppProviders } from "~/app/providers/AppProviders";
import { GlobalError } from "~/shared/ui/GlobalError";
import { GlobalNotFound } from "~/shared/ui/GlobalNotFound";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import { Toaster } from "~/shared/ui/sonner";

function RootComponent() {
	return (
		<AppProviders>
			<MaintenanceGate>
				<Outlet />
			</MaintenanceGate>
			<Toaster richColors />
		</AppProviders>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
	pendingComponent: GlobalSpinner,
	errorComponent: GlobalError,
	notFoundComponent: () => <GlobalNotFound />,
});
