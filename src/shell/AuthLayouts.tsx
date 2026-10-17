import { useConvexAuth } from "@convex-dev/auth/react";
import { Outlet } from "@tanstack/react-router";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { SignInCard } from "~/features/people/auth/SignInCard";
import { AppShell } from "~/shell/AppShell";
import { PublicShell } from "~/shell/PublicShell";

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

/** Gates sign-in-only screens. Signed out, a deep link shows a sign-in card in place and Sign in comes back to it. */
export function AuthedLayout() {
	const { isLoading, isAuthenticated } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (!isAuthenticated) {
		return (
			<div className="flex flex-1 items-center justify-center px-4 py-10">
				<div className="w-full max-w-sm">
					<SignInCard>Sign in to see this page.</SignInCard>
				</div>
			</div>
		);
	}

	return <Outlet />;
}
