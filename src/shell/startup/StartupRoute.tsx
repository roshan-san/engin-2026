import { api } from "@convex/_generated/api";
import { Outlet } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { createContext, useContext, useMemo } from "react";
import { useStartupBySlug } from "~/shell/hooks/useStartupBySlug";

type GetBySlugResult = FunctionReturnType<typeof api.teams.startups.getBySlug>;

export type MemberView = Extract<
	NonNullable<GetBySlugResult>,
	{ role: "founder" | "member" }
>;

type StartupRouteContextValue = {
	readonly slug: string;
	readonly isLoading: boolean;
	readonly result: GetBySlugResult | undefined;
	readonly member: MemberView | null;
};

const StartupRouteContext = createContext<StartupRouteContextValue | null>(null);

/**
 * Resolves and provides the /s/$slug Startup to every descendant route. The
 * screen's Startup always comes from this URL slug, never from
 * focusedStartupId — focusedStartupId only decides where the app reopens
 * next time, not which Startup the current screen shows (edge
 * SHELL-02/concurrency, ADR 0006).
 */
export function StartupRouteLayout({ slug }: { readonly slug: string }) {
	const { result, isLoading } = useStartupBySlug(slug);
	const member = result && result.role !== null ? result : null;

	const value = useMemo(
		() => ({ slug, isLoading, result, member }),
		[slug, isLoading, result, member],
	);

	return (
		<StartupRouteContext.Provider value={value}>
			<Outlet />
		</StartupRouteContext.Provider>
	);
}

export function useStartupRoute(): StartupRouteContextValue {
	const context = useContext(StartupRouteContext);
	if (!context) {
		throw new Error("useStartupRoute must be used inside /s/$slug");
	}
	return context;
}
