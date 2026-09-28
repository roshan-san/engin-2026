import { useConvexAuth } from "@convex-dev/auth/react";
import { Navigate, Outlet } from "@tanstack/react-router";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { AppShell } from "~/shell/layout/AppShell";
import { PublicShell } from "~/shell/layout/PublicShell";

/** Picks the app shell or the public header by sign-in state (UI E11/loading). */
export function ShellLayout() {
	const { isLoading, isAuthenticated } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (!isAuthenticated) {
		return (
			<PublicShell>
				<Outlet />
			</PublicShell>
		);
	}

	return (
		<AppShell>
			<Outlet />
		</AppShell>
	);
}

/** Gates sign-in-only screens. Sign-in lives on the landing page. */
export function AuthedLayout() {
	const { isAuthenticated } = useConvexAuth();

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
