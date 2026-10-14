import type { ReactNode } from "react";
import { Page } from "~/components/Page";
import { PageHeader } from "~/components/PageHeader";

/** Explore's frame: filters on the left, rows on the right. */
export function ExploreLayout({
	filters,
	children,
}: {
	readonly filters: ReactNode;
	readonly children: ReactNode;
}) {
	return (
		<>
			<PageHeader title="Explore" />
			<Page className="md:grid md:grid-cols-[14rem_1fr] md:gap-10">
				<div className="mb-4 flex flex-col gap-3 md:sticky md:top-6 md:mb-0 md:gap-6 self-start">
					{filters}
				</div>
				<div className="min-w-0">{children}</div>
			</Page>
		</>
	);
}
