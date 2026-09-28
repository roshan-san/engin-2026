import { Navigate, Outlet } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/**
 * Sends a non-Member to the public Pitch. Covers non-Members, unknown slugs
 * and Stealth Startups alike — the public Pitch shows its own not-found state
 * for the last two.
 *
 * This redirect is a UX convenience only. Every Convex call behind these
 * screens re-checks membership (T-01-11).
 */
export function MemberGate() {
	const { slug, isLoading, member } = useStartupRoute();

	if (isLoading) {
		return <PageLoading rows={3} />;
	}

	if (member === null) {
		return <Navigate to="/startup/$slug" params={{ slug }} replace />;
	}

	return <Outlet />;
}
