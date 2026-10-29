import { createRootRoute, Outlet } from "@tanstack/react-router";
import { GlobalError } from "~/shared/ui/GlobalError";
import { GlobalNotFound } from "~/shared/ui/GlobalNotFound";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import { Toaster } from "~/shared/ui/sonner";
import { AppProviders } from "~/shell/AppProviders";
import { MaintenanceGate } from "~/shell/MaintenanceGate";

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
