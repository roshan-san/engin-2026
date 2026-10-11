import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";

const TAB_CLASS =
	"relative flex items-center px-2 py-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=page]:text-foreground aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-foreground";

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
