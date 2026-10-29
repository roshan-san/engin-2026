import { useConvexAuth } from "@convex-dev/auth/react";
import type { ReactNode } from "react";
import { AppPage, PageTitle } from "~/shared/ui/AppPage";
import { SiteFooter } from "~/shared/ui/SiteFooter";

/** Explore's frame: the count in the bar, the filters in a strip under it, rows in the column. Signed out, the site footer scrolls at the end of the rows. */
export function ExploreLayout({
	context,
	filters,
	children,
}: {
	readonly context: string | null;
	readonly filters: ReactNode;
	readonly children: ReactNode;
}) {
	const { isLoading, isAuthenticated } = useConvexAuth();

	return (
		<AppPage
			bar={{ title: <PageTitle name="Explore" context={context} /> }}
			notice={
				<div className="flex gap-x-6 gap-y-2 overflow-x-auto border-b border-border px-4 py-2 md:flex-wrap md:px-6">
					{filters}
				</div>
			}
			footer={!isLoading && !isAuthenticated ? <SiteFooter /> : undefined}
		>
			{children}
		</AppPage>
	);
}
