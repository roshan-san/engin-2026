import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

/** "Hiring › Frontend": back to the Startup's Hackathons, then the one you're in. */
export function HiringCrumb({
	slug,
	children,
}: {
	readonly slug: string;
	readonly children: ReactNode;
}) {
	return (
		<nav
			aria-label="Breadcrumb"
			className="flex min-w-0 items-center gap-1 text-sm"
		>
			<Link
				to="/s/$slug/hiring"
				params={{ slug }}
				className="shrink-0 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
			>
				Hiring
			</Link>
			<ChevronRightIcon
				aria-hidden
				className="size-4 shrink-0 text-subtle-foreground"
			/>
			{children}
		</nav>
	);
}
