import { api } from "@convex/_generated/api";
import { useMatch } from "@tanstack/react-router";
import { useQuery } from "convex/react";

/**
 * Memberships plus the resolved Focused Startup for shell components. The
 * URL always wins: with a Startup slug in the route, that membership is
 * "focused" so the sidebar always matches the screen (ADR 0006). With no
 * slug in the URL, this falls back to the User's last Focused Startup, then
 * the first entry of the (already name-sorted) list — edge SHELL-02/ordering.
 */
export function useFocusedStartup() {
	const memberships = useQuery(api.teams.startups.listMemberships);
	const match = useMatch({
		from: "/_shell/_authed/s/$slug",
		shouldThrow: false,
	});
	const slug = match?.params.slug;

	const list = memberships ?? [];
	const focused =
		(slug ? list.find((entry) => entry.startup.slug === slug) : undefined) ??
		list.find((entry) => entry.isFocused) ??
		list[0] ??
		null;

	return {
		memberships: list,
		focused,
		isLoading: memberships === undefined,
		hasStartups: list.length > 0,
	};
}
