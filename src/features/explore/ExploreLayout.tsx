import type { ReactNode } from "react";
import { AppPage, PageTitle } from "~/components/AppPage";

/** Explore's frame: the count in the bar, the filters in a strip under it, rows in the column. */
export function ExploreLayout({
	context,
	filters,
	children,
}: {
	readonly context: string | null;
	readonly filters: ReactNode;
	readonly children: ReactNode;
}) {
	return (
		<AppPage
			bar={{ title: <PageTitle name="Explore" context={context} /> }}
			notice={
				<div className="flex gap-x-6 gap-y-2 overflow-x-auto border-b border-border px-4 py-2 md:flex-wrap md:px-6">
					{filters}
				</div>
			}
		>
			{children}
		</AppPage>
	);
}
