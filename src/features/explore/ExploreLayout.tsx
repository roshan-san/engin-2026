import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { TAB_CLASS } from "~/shell/topbar/PlaceTabs";

/** Explore's frame: the two tabs on top, filters on the left, rows on the right. */
export function ExploreLayout({
	filters,
	children,
}: {
	readonly filters: ReactNode;
	readonly children: ReactNode;
}) {
	return (
		<>
			<PageHeader
				title="Explore"
				actions={
					<nav className="flex items-stretch">
						<Link to="/explore/hackathons" className={TAB_CLASS}>
							Hackathons
						</Link>
						<Link to="/explore/startups" className={TAB_CLASS}>
							Startups
						</Link>
					</nav>
				}
			/>
			<Page className="md:grid md:grid-cols-[14rem_1fr] md:gap-10">
				<div className="mb-4 flex flex-col gap-3 md:sticky md:top-20 md:mb-0 md:gap-6 self-start">
					{filters}
				</div>
				<div className="min-w-0">{children}</div>
			</Page>
		</>
	);
}
