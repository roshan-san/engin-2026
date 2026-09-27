import { createRootRoute, Outlet } from "@tanstack/react-router";
import { GlobalError } from "~/components/globals/GlobalError";
import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { Toaster } from "~/components/ui/sonner";
import { AppProviders } from "~/features/people/auth/providers/AppProviders";

function RootComponent() {
	return (
		<AppProviders>
			<Outlet />
			<Toaster richColors />
		</AppProviders>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
	pendingComponent: GlobalSpinner,
	errorComponent: GlobalError,
	notFoundComponent: GlobalNotFound,
});
